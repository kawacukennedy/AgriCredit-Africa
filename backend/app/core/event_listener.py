import asyncio
import json
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
import structlog

from web3 import Web3, AsyncWeb3
from web3.contract import Contract
from web3.exceptions import ContractLogicError
from eth_abi import decode

from .config import settings
from .blockchain import blockchain_service
from ..database.config import get_db
from ..database.models import User, Loan, CarbonCredit, Notification

logger = structlog.get_logger()

class EventListener:
    """Blockchain event listener for smart contract monitoring"""

    def __init__(self):
        self.w3 = blockchain_service.w3
        self.contracts = blockchain_service.contracts
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.running = False
        self.tasks = []

        # Initialize event handlers
        self._setup_event_handlers()

    def _setup_event_handlers(self):
        """Set up event handlers for different contract events"""
        # Loan Manager Events
        self.add_event_handler('LoanManager', 'LoanCreated', self._handle_loan_created)
        self.add_event_handler('LoanManager', 'LoanRepaid', self._handle_loan_repaid)
        self.add_event_handler('LoanManager', 'LoanDefaulted', self._handle_loan_defaulted)

        # Carbon Token Events
        self.add_event_handler('CarbonToken', 'CarbonTokensMinted', self._handle_carbon_minted)
        self.add_event_handler('CarbonToken', 'Transfer', self._handle_carbon_transfer)

        # Governance DAO Events
        self.add_event_handler('GovernanceDAO', 'ProposalCreated', self._handle_proposal_created)
        self.add_event_handler('GovernanceDAO', 'VoteCast', self._handle_vote_cast)
        self.add_event_handler('GovernanceDAO', 'ProposalExecuted', self._handle_proposal_executed)

        # NFT Farming Events
        self.add_event_handler('NFTFarming', 'FarmNFTMinted', self._handle_nft_minted)
        self.add_event_handler('NFTFarming', 'HarvestRecorded', self._handle_harvest_recorded)

        # Yield Token Events
        self.add_event_handler('YieldToken', 'Deposit', self._handle_yield_deposit)
        self.add_event_handler('YieldToken', 'Withdrawal', self._handle_yield_withdrawal)
        self.add_event_handler('YieldToken', 'YieldClaimed', self._handle_yield_claimed)

        # Marketplace Escrow Events
        self.add_event_handler('MarketplaceEscrow', 'EscrowCreated', self._handle_escrow_created)
        self.add_event_handler('MarketplaceEscrow', 'EscrowFunded', self._handle_escrow_funded)
        self.add_event_handler('MarketplaceEscrow', 'DeliveryConfirmed', self._handle_delivery_confirmed)

    def add_event_handler(self, contract_name: str, event_name: str, handler: Callable):
        """Add an event handler for a specific contract event"""
        key = f"{contract_name}.{event_name}"
        if key not in self.event_handlers:
            self.event_handlers[key] = []
        self.event_handlers[key].append(handler)
        logger.info("Added event handler", contract=contract_name, event=event_name)

    async def start_listening(self):
        """Start listening for blockchain events"""
        if not self.w3 or not self.w3.is_connected():
            logger.error("Cannot start event listening - blockchain not connected")
            return

        self.running = True
        logger.info("Starting blockchain event listeners")

        # Start event listeners for each contract
        for contract_name in self.contracts.keys():
            task = asyncio.create_task(self._listen_to_contract_events(contract_name))
            self.tasks.append(task)

        # Start oracle data monitoring
        oracle_task = asyncio.create_task(self._monitor_oracle_data())
        self.tasks.append(oracle_task)

        logger.info("All event listeners started")

    async def stop_listening(self):
        """Stop listening for blockchain events"""
        self.running = False
        logger.info("Stopping blockchain event listeners")

        # Cancel all tasks
        for task in self.tasks:
            task.cancel()

        # Wait for tasks to complete
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks = []

        logger.info("All event listeners stopped")

    async def _listen_to_contract_events(self, contract_name: str):
        """Listen to events for a specific contract"""
        contract = self.contracts.get(contract_name)
        if not contract:
            logger.warning("Contract not available for event listening", contract=contract_name)
            return

        try:
            # Get the latest block
            latest_block = self.w3.eth.block_number
            start_block = max(0, latest_block - 100)  # Start from 100 blocks ago

            while self.running:
                try:
                    # Get new blocks
                    current_block = self.w3.eth.block_number
                    if current_block > latest_block:
                        # Process events from new blocks
                        await self._process_events(contract_name, contract, latest_block + 1, current_block)
                        latest_block = current_block

                    # Wait before checking again
                    await asyncio.sleep(10)  # Check every 10 seconds

                except Exception as e:
                    logger.error("Error in event listening loop",
                               contract=contract_name, error=str(e))
                    await asyncio.sleep(30)  # Wait longer on error

        except Exception as e:
            logger.error("Event listening failed", contract=contract_name, error=str(e))

    async def _process_events(self, contract_name: str, contract: Contract,
                            from_block: int, to_block: int):
        """Process events for a contract within a block range"""
        try:
            # Get all events for this contract in the block range
            events = await self._get_contract_events(contract, from_block, to_block)

            for event in events:
                event_name = event['event']
                key = f"{contract_name}.{event_name}"

                # Call all handlers for this event
                if key in self.event_handlers:
                    for handler in self.event_handlers[key]:
                        try:
                            await handler(event)
                        except Exception as e:
                            logger.error("Event handler failed",
                                       contract=contract_name,
                                       event=event_name,
                                       error=str(e))

        except Exception as e:
            logger.error("Event processing failed",
                        contract=contract_name,
                        from_block=from_block,
                        to_block=to_block,
                        error=str(e))

    async def _get_contract_events(self, contract: Contract, from_block: int, to_block: int) -> List[Dict]:
        """Get events for a contract within a block range"""
        events = []

        try:
            # Get event logs
            logs = self.w3.eth.get_logs({
                'fromBlock': from_block,
                'toBlock': to_block,
                'address': contract.address
            })

            for log in logs:
                try:
                    # Decode the event
                    event = contract.events.processLog(log)
                    events.append({
                        'event': event['event'],
                        'args': dict(event['args']),
                        'blockNumber': log['blockNumber'],
                        'transactionHash': log['transactionHash'].hex(),
                        'logIndex': log['logIndex']
                    })
                except Exception as e:
                    logger.warning("Failed to decode event log", error=str(e), log=log)

        except Exception as e:
            logger.error("Failed to get contract events", error=str(e))

        return events

    async def _monitor_oracle_data(self):
        """Monitor oracle data feeds"""
        while self.running:
            try:
                await self._update_oracle_prices()
                await self._update_weather_data()
                await self._update_crop_yield_data()

                # Update every 5 minutes
                await asyncio.sleep(300)

            except Exception as e:
                logger.error("Oracle monitoring failed", error=str(e))
                await asyncio.sleep(60)  # Wait 1 minute on error

    async def _update_oracle_prices(self):
        """Update price data from oracles"""
        # This would integrate with Chainlink price feeds
        # For now, we'll simulate price updates
        logger.info("Updating oracle price data")

        # Mock price updates - in production, this would read from Chainlink
        price_updates = {
            'corn_price': 185.50,
            'wheat_price': 220.75,
            'soybean_price': 425.25,
            'exchange_rate_usd_ngn': 0.0022
        }

        # Store in cache for use by AI models
        from .cache import cache
        for key, value in price_updates.items():
            await cache.set_oracle_price(key, value)

    async def _update_weather_data(self):
        """Update weather data from oracles"""
        logger.info("Updating weather data")

        # Mock weather updates
        weather_updates = {
            'nairobi_temp': 24.5,
            'lagos_humidity': 78.0,
            'accra_rainfall': 12.5
        }

        from .cache import cache
        for key, value in weather_updates.items():
            await cache.set_weather_data(key, value)

    async def _update_crop_yield_data(self):
        """Update crop yield data from oracles"""
        logger.info("Updating crop yield data")

        # Mock yield updates
        yield_updates = {
            'corn_yield_avg': 8.5,
            'cassava_yield_avg': 25.0,
            'rice_yield_avg': 6.8
        }

        from .cache import cache
        for key, value in yield_updates.items():
            await cache.set_crop_yield_data(key, value)

    # Event Handlers
    async def _handle_loan_created(self, event: Dict[str, Any]):
        """Handle loan creation event"""
        logger.info("Loan created event", loan_id=event['args'].get('loanId'))

        # Update database with blockchain loan data
        db = next(get_db())
        try:
            # This would sync blockchain data with database
            # For now, just log the event
            pass
        except Exception as e:
            logger.error("Failed to process loan created event", error=str(e))

    async def _handle_loan_repaid(self, event: Dict[str, Any]):
        """Handle loan repayment event"""
        logger.info("Loan repaid event",
                   loan_id=event['args'].get('loanId'),
                   amount=event['args'].get('amount'))

        # Update loan status in database
        db = next(get_db())
        try:
            loan_id = event['args'].get('loanId')
            # Update loan repayment status
            pass
        except Exception as e:
            logger.error("Failed to process loan repaid event", error=str(e))

    async def _handle_loan_defaulted(self, event: Dict[str, Any]):
        """Handle loan default event"""
        logger.warning("Loan defaulted event", loan_id=event['args'].get('loanId'))

        # Create notification for loan default
        db = next(get_db())
        try:
            loan_id = event['args'].get('loanId')
            # Create default notification
            pass
        except Exception as e:
            logger.error("Failed to process loan defaulted event", error=str(e))

    async def _handle_carbon_minted(self, event: Dict[str, Any]):
        """Handle carbon token minting event"""
        logger.info("Carbon tokens minted",
                   to=event['args'].get('to'),
                   amount=event['args'].get('amount'))

        # Update carbon credit balance
        db = next(get_db())
        try:
            recipient = event['args'].get('to')
            amount = event['args'].get('amount')
            # Update carbon credit records
            pass
        except Exception as e:
            logger.error("Failed to process carbon minted event", error=str(e))

    async def _handle_carbon_transfer(self, event: Dict[str, Any]):
        """Handle carbon token transfer event"""
        logger.info("Carbon tokens transferred",
                   from_addr=event['args'].get('from'),
                   to=event['args'].get('to'),
                   amount=event['args'].get('value'))

    async def _handle_proposal_created(self, event: Dict[str, Any]):
        """Handle governance proposal creation"""
        logger.info("Governance proposal created",
                   proposal_id=event['args'].get('proposalId'),
                   proposer=event['args'].get('proposer'))

        # Create notification for new proposal
        db = next(get_db())
        try:
            # Notify all DAO members
            pass
        except Exception as e:
            logger.error("Failed to process proposal created event", error=str(e))

    async def _handle_vote_cast(self, event: Dict[str, Any]):
        """Handle governance vote event"""
        logger.info("Vote cast on proposal",
                   proposal_id=event['args'].get('proposalId'),
                   voter=event['args'].get('voter'),
                   support=event['args'].get('support'))

    async def _handle_proposal_executed(self, event: Dict[str, Any]):
        """Handle proposal execution event"""
        logger.info("Proposal executed", proposal_id=event['args'].get('proposalId'))

    async def _handle_nft_minted(self, event: Dict[str, Any]):
        """Handle NFT minting event"""
        logger.info("Farm NFT minted",
                   token_id=event['args'].get('tokenId'),
                   farmer=event['args'].get('farmer'))

    async def _handle_harvest_recorded(self, event: Dict[str, Any]):
        """Handle harvest recording event"""
        logger.info("Harvest recorded for NFT",
                   token_id=event['args'].get('tokenId'),
                   yield_amount=event['args'].get('actualYield'))

    async def _handle_yield_deposit(self, event: Dict[str, Any]):
        """Handle yield farming deposit"""
        logger.info("Yield farming deposit",
                   user=event['args'].get('user'),
                   amount=event['args'].get('amount'))

    async def _handle_yield_withdrawal(self, event: Dict[str, Any]):
        """Handle yield farming withdrawal"""
        logger.info("Yield farming withdrawal",
                   user=event['args'].get('user'),
                   amount=event['args'].get('amount'))

    async def _handle_yield_claimed(self, event: Dict[str, Any]):
        """Handle yield claim event"""
        logger.info("Yield claimed",
                   user=event['args'].get('user'),
                   amount=event['args'].get('amount'))

    async def _handle_escrow_created(self, event: Dict[str, Any]):
        """Handle escrow creation event"""
        logger.info("Marketplace escrow created",
                   escrow_id=event['args'].get('escrowId'),
                   seller=event['args'].get('seller'))

    async def _handle_escrow_funded(self, event: Dict[str, Any]):
        """Handle escrow funding event"""
        logger.info("Marketplace escrow funded", escrow_id=event['args'].get('escrowId'))

    async def _handle_delivery_confirmed(self, event: Dict[str, Any]):
        """Handle delivery confirmation event"""
        logger.info("Delivery confirmed for escrow", escrow_id=event['args'].get('escrowId'))

# Global event listener instance
event_listener = EventListener()