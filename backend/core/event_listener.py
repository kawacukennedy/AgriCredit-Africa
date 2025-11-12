import asyncio
from typing import Dict, Any, Callable, List
from web3 import Web3
from web3.contract import ContractEvent
import logging
from .config import settings
from .blockchain import blockchain_service

logger = logging.getLogger(__name__)

class EventListener:
    """Blockchain event listener for smart contract events"""

    def __init__(self):
        self.w3 = None
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.running = False
        self.tasks = []

    def connect(self):
        """Connect to blockchain"""
        if blockchain_service.is_connected():
            self.w3 = blockchain_service.w3
            return True
        return False

    def register_handler(self, event_name: str, handler: Callable):
        """Register event handler"""
        if event_name not in self.event_handlers:
            self.event_handlers[event_name] = []
        self.event_handlers[event_name].append(handler)
        logger.info(f"Registered handler for event: {event_name}")

    def unregister_handler(self, event_name: str, handler: Callable):
        """Unregister event handler"""
        if event_name in self.event_handlers:
            try:
                self.event_handlers[event_name].remove(handler)
                logger.info(f"Unregistered handler for event: {event_name}")
            except ValueError:
                pass

    async def listen_for_events(self, contract_name: str, event_name: str,
                              from_block: int = None):
        """Listen for specific contract events"""
        if not self.w3 or contract_name not in blockchain_service.contracts:
            logger.error(f"Cannot listen for events: contract {contract_name} not available")
            return

        contract = blockchain_service.contracts[contract_name]
        event_filter = contract.events[event_name].create_filter(
            fromBlock=from_block or "latest"
        )

        logger.info(f"Started listening for {contract_name}.{event_name} events")

        while self.running:
            try:
                # Get new events
                events = event_filter.get_new_entries()

                for event in events:
                    await self._handle_event(contract_name, event_name, event)

                # Wait before checking again
                await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"Error listening for {contract_name}.{event_name} events: {e}")
                await asyncio.sleep(5)  # Wait longer on error

    async def _handle_event(self, contract_name: str, event_name: str, event: Dict[str, Any]):
        """Handle individual event"""
        try:
            # Get event data
            event_data = {
                'contract': contract_name,
                'event': event_name,
                'block_number': event.blockNumber,
                'transaction_hash': event.transactionHash.hex(),
                'log_index': event.logIndex,
                'args': dict(event.args) if hasattr(event, 'args') else {},
                'raw_event': event
            }

            # Call registered handlers
            full_event_name = f"{contract_name}.{event_name}"
            if full_event_name in self.event_handlers:
                for handler in self.event_handlers[full_event_name]:
                    try:
                        await handler(event_data)
                    except Exception as e:
                        logger.error(f"Error in event handler for {full_event_name}: {e}")

            logger.info(f"Processed event: {full_event_name} at block {event.blockNumber}")

        except Exception as e:
            logger.error(f"Error handling event {contract_name}.{event_name}: {e}")

    async def start_listening(self):
        """Start all event listeners"""
        if not self.connect():
            logger.error("Cannot start event listening: blockchain not connected")
            return

        self.running = True

        # Start listeners for different contracts and events
        listeners = [
            ("LoanManager", "LoanCreated"),
            ("LoanManager", "LoanRepaid"),
            ("LoanManager", "LoanDefaulted"),
            ("MarketplaceEscrow", "ListingCreated"),
            ("MarketplaceEscrow", "ListingSold"),
            ("MarketplaceEscrow", "ListingCancelled"),
            ("CarbonToken", "Transfer"),
            ("CarbonToken", "CarbonMinted"),
            ("GovernanceDAO", "ProposalCreated"),
            ("GovernanceDAO", "VoteCast"),
            ("GovernanceDAO", "ProposalExecuted"),
            ("NFTFarming", "FarmMinted"),
            ("NFTFarming", "HarvestRecorded"),
            ("IdentityRegistry", "IdentityCreated"),
            ("IdentityRegistry", "IdentityVerified")
        ]

        for contract_name, event_name in listeners:
            if contract_name in blockchain_service.contracts:
                task = asyncio.create_task(
                    self.listen_for_events(contract_name, event_name)
                )
                self.tasks.append(task)

        logger.info("Event listener started")

    async def stop_listening(self):
        """Stop all event listeners"""
        self.running = False

        # Cancel all tasks
        for task in self.tasks:
            task.cancel()

        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)

        self.tasks = []
        logger.info("Event listener stopped")

# Default event handlers
async def handle_loan_created(event_data: Dict[str, Any]):
    """Handle loan creation events"""
    args = event_data['args']
    logger.info(f"Loan created: ID {args.get('loanId')}, borrower {args.get('borrower')}, amount {args.get('amount')}")

    # Could trigger notifications, update database, etc.
    # For now, just log

async def handle_loan_repaid(event_data: Dict[str, Any]):
    """Handle loan repayment events"""
    args = event_data['args']
    logger.info(f"Loan repaid: ID {args.get('loanId')}, amount {args.get('amount')}")

async def handle_listing_created(event_data: Dict[str, Any]):
    """Handle marketplace listing creation"""
    args = event_data['args']
    logger.info(f"Listing created: ID {args.get('listingId')}, seller {args.get('seller')}, price {args.get('price')}")

async def handle_carbon_minted(event_data: Dict[str, Any]):
    """Handle carbon token minting"""
    args = event_data['args']
    logger.info(f"Carbon tokens minted: recipient {args.get('recipient')}, amount {args.get('amount')}")

async def handle_identity_created(event_data: Dict[str, Any]):
    """Handle identity creation"""
    args = event_data['args']
    logger.info(f"Identity created: address {args.get('user')}, DID {args.get('did')}")

# Global event listener instance
event_listener = EventListener()

# Register default handlers
event_listener.register_handler("LoanManager.LoanCreated", handle_loan_created)
event_listener.register_handler("LoanManager.LoanRepaid", handle_loan_repaid)
event_listener.register_handler("MarketplaceEscrow.ListingCreated", handle_listing_created)
event_listener.register_handler("CarbonToken.CarbonMinted", handle_carbon_minted)
event_listener.register_handler("IdentityRegistry.IdentityCreated", handle_identity_created)