from typing import Dict, Any, List, Optional
import asyncio
from datetime import datetime, timedelta
from .blockchain import blockchain_service

class GovernanceManager:
    """DAO Governance Manager for proposal and voting management"""

    def __init__(self):
        self.proposals = {}
        self.votes = {}

    async def create_proposal(self, proposer_address: str, title: str, description: str,
                            targets: List[str], values: List[int], signatures: List[str],
                            calldatas: List[str], start_block: Optional[int] = None,
                            end_block: Optional[int] = None) -> Dict[str, Any]:
        """Create a new governance proposal"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or GovernanceDAO contract not loaded")

        contract = blockchain_service.contracts['GovernanceDAO']

        # Set default voting period if not provided
        if start_block is None:
            start_block = blockchain_service.w3.eth.block_number
        if end_block is None:
            end_block = start_block + 50400  # ~7 days at 12s blocks

        # Create proposal on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.propose(targets, values, signatures, calldatas, description),
            proposer_address
        )

        proposal_id = tx_result.get('proposal_id')

        # Store proposal metadata
        proposal = {
            'id': proposal_id,
            'title': title,
            'description': description,
            'proposer': proposer_address,
            'targets': targets,
            'values': values,
            'signatures': signatures,
            'calldatas': calldatas,
            'start_block': start_block,
            'end_block': end_block,
            'created_at': datetime.utcnow(),
            'status': 'active',
            'votes_for': 0,
            'votes_against': 0,
            'votes_abstain': 0
        }

        self.proposals[proposal_id] = proposal

        return {
            'proposal_id': proposal_id,
            'status': 'created',
            'start_block': start_block,
            'end_block': end_block
        }

    async def vote_on_proposal(self, voter_address: str, proposal_id: int,
                             support: bool, reason: Optional[str] = None) -> Dict[str, Any]:
        """Cast a vote on a proposal"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or GovernanceDAO contract not loaded")

        contract = blockchain_service.contracts['GovernanceDAO']

        # Convert support to uint8 (0=against, 1=for, 2=abstain)
        support_value = 1 if support else 0

        # Cast vote on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.castVote(proposal_id, support_value),
            voter_address
        )

        # Record vote locally
        vote_key = f"{proposal_id}_{voter_address}"
        self.votes[vote_key] = {
            'proposal_id': proposal_id,
            'voter': voter_address,
            'support': support,
            'reason': reason,
            'timestamp': datetime.utcnow()
        }

        # Update proposal vote counts
        if proposal_id in self.proposals:
            if support:
                self.proposals[proposal_id]['votes_for'] += 1
            else:
                self.proposals[proposal_id]['votes_against'] += 1

        return {
            'proposal_id': proposal_id,
            'voter': voter_address,
            'support': support,
            'status': 'voted'
        }

    async def get_proposal(self, proposal_id: int) -> Optional[Dict[str, Any]]:
        """Get proposal details"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            return None

        contract = blockchain_service.contracts['GovernanceDAO']

        try:
            # Get proposal data from blockchain
            proposal_data = contract.functions.getProposal(proposal_id).call()

            # Combine with local metadata
            local_data = self.proposals.get(proposal_id, {})

            return {
                'id': proposal_id,
                'title': local_data.get('title', ''),
                'description': local_data.get('description', ''),
                'proposer': proposal_data[0],
                'targets': proposal_data[1],
                'values': proposal_data[2],
                'signatures': proposal_data[3],
                'calldatas': proposal_data[4],
                'start_block': proposal_data[5],
                'end_block': proposal_data[6],
                'for_votes': proposal_data[7],
                'against_votes': proposal_data[8],
                'abstain_votes': proposal_data[9],
                'executed': proposal_data[10],
                'canceled': proposal_data[11],
                'status': self._get_proposal_status(proposal_data),
                'created_at': local_data.get('created_at')
            }

        except Exception as e:
            print(f"Error getting proposal {proposal_id}: {e}")
            return None

    async def get_proposals(self, state: Optional[str] = None, limit: int = 50,
                          offset: int = 0) -> List[Dict[str, Any]]:
        """Get list of proposals with optional filtering"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            return []

        contract = blockchain_service.contracts['GovernanceDAO']

        try:
            # Get proposal count
            proposal_count = contract.functions.proposalCount().call()

            proposals = []
            for i in range(max(0, proposal_count - offset - limit), proposal_count - offset):
                proposal = await self.get_proposal(i)
                if proposal:
                    if state is None or proposal['status'] == state:
                        proposals.append(proposal)

            return proposals

        except Exception as e:
            print(f"Error getting proposals: {e}")
            return []

    async def get_proposal_votes(self, proposal_id: int) -> List[Dict[str, Any]]:
        """Get votes for a proposal"""
        votes = []
        for vote_key, vote_data in self.votes.items():
            if vote_data['proposal_id'] == proposal_id:
                votes.append(vote_data)

        return votes

    async def execute_proposal(self, proposal_id: int, executor_address: str) -> Dict[str, Any]:
        """Execute a successful proposal"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or GovernanceDAO contract not loaded")

        contract = blockchain_service.contracts['GovernanceDAO']

        # Execute proposal on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.execute(proposal_id),
            executor_address
        )

        # Update local status
        if proposal_id in self.proposals:
            self.proposals[proposal_id]['status'] = 'executed'

        return {
            'proposal_id': proposal_id,
            'status': 'executed',
            'tx_hash': tx_result.get('tx_hash')
        }

    async def get_voting_power(self, voter_address: str) -> int:
        """Get voting power for an address"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            return 0

        contract = blockchain_service.contracts['GovernanceDAO']

        try:
            return contract.functions.getVotes(voter_address, blockchain_service.w3.eth.block_number).call()
        except Exception:
            return 0

    async def delegate_votes(self, delegator_address: str, delegate_address: str) -> Dict[str, Any]:
        """Delegate voting power to another address"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or GovernanceDAO contract not loaded")

        contract = blockchain_service.contracts['GovernanceDAO']

        # Delegate votes on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.delegate(delegate_address),
            delegator_address
        )

        return {
            'delegator': delegator_address,
            'delegate': delegate_address,
            'status': 'delegated',
            'tx_hash': tx_result.get('tx_hash')
        }

    async def get_governance_stats(self) -> Dict[str, Any]:
        """Get governance statistics"""
        if not blockchain_service.is_connected() or 'GovernanceDAO' not in blockchain_service.contracts:
            return {}

        contract = blockchain_service.contracts['GovernanceDAO']

        try:
            proposal_count = contract.functions.proposalCount().call()
            quorum = contract.functions.quorum(blockchain_service.w3.eth.block_number).call()
            voting_delay = contract.functions.votingDelay().call()
            voting_period = contract.functions.votingPeriod().call()

            return {
                'total_proposals': proposal_count,
                'quorum': quorum,
                'voting_delay_blocks': voting_delay,
                'voting_period_blocks': voting_period,
                'active_proposals': len([p for p in self.proposals.values() if p['status'] == 'active'])
            }

        except Exception as e:
            print(f"Error getting governance stats: {e}")
            return {}

    def _get_proposal_status(self, proposal_data: tuple) -> str:
        """Determine proposal status from blockchain data"""
        executed, canceled = proposal_data[10], proposal_data[11]

        if executed:
            return 'executed'
        elif canceled:
            return 'canceled'
        elif blockchain_service.w3.eth.block_number > proposal_data[6]:  # end_block
            return 'defeated'
        else:
            return 'active'

# Global governance manager instance
governance_manager = GovernanceManager()