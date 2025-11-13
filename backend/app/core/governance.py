import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import structlog

from .blockchain import blockchain_service
from .cache import cache
from ..database.config import get_db
from ..database.models import User, GovernanceProposal, GovernanceVote

logger = structlog.get_logger()

class GovernanceManager:
    """Comprehensive DAO governance management for AgriCredit platform"""

    def __init__(self):
        self.proposal_states = {
            0: 'pending',
            1: 'active',
            2: 'canceled',
            3: 'defeated',
            4: 'succeeded',
            5: 'queued',
            6: 'expired',
            7: 'executed'
        }

    async def create_proposal(self, proposer_address: str, title: str, description: str,
                            targets: List[str], values: List[int], signatures: List[str],
                            calldatas: List[str], start_block: Optional[int] = None,
                            end_block: Optional[int] = None) -> Dict[str, Any]:
        """Create a comprehensive governance proposal"""
        try:
            # Validate proposal parameters
            if len(targets) != len(values) or len(values) != len(signatures) or len(signatures) != len(calldatas):
                raise ValueError("Proposal parameters arrays must have equal length")

            # Create database record first
            db = next(get_db())
            proposal = GovernanceProposal(
                proposer_address=proposer_address,
                title=title,
                description=description,
                targets=targets,
                values=values,
                signatures=signatures,
                calldatas=calldatas,
                start_block=start_block,
                end_block=end_block,
                state='pending'
            )
            db.add(proposal)
            db.commit()
            db.refresh(proposal)

            # Create proposal on blockchain
            result = await blockchain_service.create_proposal(description)

            # Update database with blockchain proposal ID
            proposal.proposal_id = result.get('proposal_id')
            proposal.transaction_hash = result.get('tx_hash')
            db.commit()

            # Cache proposal data
            await self._cache_proposal(proposal)

            logger.info("Governance proposal created",
                       proposal_id=proposal.proposal_id,
                       proposer=proposer_address,
                       title=title)

            return {
                'proposal_id': proposal.proposal_id,
                'tx_hash': result.get('tx_hash'),
                'status': 'created'
            }

        except Exception as e:
            logger.error("Proposal creation failed",
                        proposer=proposer_address, title=title, error=str(e))
            raise

    async def vote_on_proposal(self, voter_address: str, proposal_id: int,
                             support: bool, reason: Optional[str] = None) -> Dict[str, Any]:
        """Cast a vote on a governance proposal"""
        try:
            # Check if proposal exists and is active
            proposal = await self.get_proposal(proposal_id)
            if not proposal or proposal['state'] != 'active':
                raise ValueError(f"Proposal {proposal_id} is not active for voting")

            # Check voting power
            voting_power = await self.get_voting_power(voter_address)
            if voting_power <= 0:
                raise ValueError(f"Address {voter_address} has no voting power")

            # Create database record
            db = next(get_db())
            vote = GovernanceVote(
                proposal_id=proposal_id,
                voter_address=voter_address,
                support=support,
                voting_power=voting_power,
                reason=reason
            )
            db.add(vote)
            db.commit()

            # Cast vote on blockchain
            result = await blockchain_service.vote_on_proposal(proposal_id, support)

            # Update vote record
            vote.transaction_hash = result.get('tx_hash')
            db.commit()

            # Update cached proposal data
            await self._update_proposal_votes(proposal_id)

            logger.info("Vote cast on proposal",
                       proposal_id=proposal_id,
                       voter=voter_address,
                       support=support,
                       voting_power=voting_power)

            return {
                'vote_id': vote.id,
                'tx_hash': result.get('tx_hash'),
                'voting_power': voting_power,
                'status': 'voted'
            }

        except Exception as e:
            logger.error("Vote casting failed",
                        voter=voter_address, proposal_id=proposal_id, error=str(e))
            raise

    async def execute_proposal(self, proposal_id: int, executor_address: str) -> Dict[str, Any]:
        """Execute a successful governance proposal"""
        try:
            # Check if proposal can be executed
            proposal = await self.get_proposal(proposal_id)
            if not proposal or proposal['state'] != 'succeeded':
                raise ValueError(f"Proposal {proposal_id} is not ready for execution")

            # Execute on blockchain
            result = await blockchain_service.execute_proposal(proposal_id)

            # Update database
            db = next(get_db())
            db_proposal = db.query(GovernanceProposal).filter(
                GovernanceProposal.proposal_id == proposal_id
            ).first()

            if db_proposal:
                db_proposal.state = 'executed'
                db_proposal.executed_at = datetime.utcnow()
                db_proposal.execution_tx_hash = result.get('tx_hash')
                db.commit()

            # Update cache
            await self._cache_proposal(db_proposal)

            logger.info("Proposal executed",
                       proposal_id=proposal_id,
                       executor=executor_address,
                       tx_hash=result.get('tx_hash'))

            return {
                'proposal_id': proposal_id,
                'tx_hash': result.get('tx_hash'),
                'status': 'executed'
            }

        except Exception as e:
            logger.error("Proposal execution failed",
                        proposal_id=proposal_id, error=str(e))
            raise

    async def get_proposal(self, proposal_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed proposal information"""
        try:
            # Try cache first
            cache_key = f"proposal:{proposal_id}"
            cached = await cache.get(cache_key)
            if cached:
                return cached

            # Get from database
            db = next(get_db())
            proposal = db.query(GovernanceProposal).filter(
                GovernanceProposal.proposal_id == proposal_id
            ).first()

            if not proposal:
                return None

            # Get blockchain data
            blockchain_data = await blockchain_service.get_proposal(proposal_id)

            # Combine data
            proposal_data = {
                'id': proposal.id,
                'proposal_id': proposal.proposal_id,
                'proposer': proposal.proposer_address,
                'title': proposal.title,
                'description': proposal.description,
                'targets': proposal.targets,
                'values': proposal.values,
                'signatures': proposal.signatures,
                'calldatas': proposal.calldatas,
                'start_block': proposal.start_block,
                'end_block': proposal.end_block,
                'state': proposal.state,
                'created_at': proposal.created_at.isoformat(),
                'executed_at': proposal.executed_at.isoformat() if proposal.executed_at else None,
                'transaction_hash': proposal.transaction_hash,
                'execution_tx_hash': proposal.execution_tx_hash,
                'blockchain_data': blockchain_data
            }

            # Cache for 5 minutes
            await cache.set(cache_key, proposal_data, expire=300)

            return proposal_data

        except Exception as e:
            logger.error("Proposal retrieval failed", proposal_id=proposal_id, error=str(e))
            return None

    async def get_proposals(self, state: Optional[str] = None, limit: int = 50,
                          offset: int = 0) -> List[Dict[str, Any]]:
        """Get list of proposals with optional filtering"""
        try:
            db = next(get_db())
            query = db.query(GovernanceProposal)

            if state:
                query = query.filter(GovernanceProposal.state == state)

            proposals = query.order_by(GovernanceProposal.created_at.desc())\
                            .offset(offset).limit(limit).all()

            result = []
            for proposal in proposals:
                # Get voting data
                votes_data = await self.get_proposal_votes(proposal.proposal_id)

                # Map to frontend format
                proposal_data = {
                    'id': proposal.proposal_id,
                    'proposer': proposal.proposer_address,
                    'description': proposal.description,
                    'for_votes': str(votes_data.get('for_votes', 0)),
                    'against_votes': str(votes_data.get('against_votes', 0)),
                    'start_time': int(proposal.created_at.timestamp() * 1000),  # milliseconds
                    'end_time': int((proposal.created_at + timedelta(days=7)).timestamp() * 1000),  # 7 days voting period
                    'executed': proposal.state == 'executed',
                    'status': self._map_proposal_status(proposal.state),
                    'created_at': proposal.created_at.isoformat()
                }
                result.append(proposal_data)

            return result

        except Exception as e:
            logger.error("Proposals retrieval failed", error=str(e))
            return []

    def _map_proposal_status(self, state: str) -> str:
        """Map database state to frontend status"""
        status_map = {
            'pending': 'active',
            'active': 'active',
            'canceled': 'failed',
            'defeated': 'failed',
            'succeeded': 'passed',
            'queued': 'passed',
            'expired': 'failed',
            'executed': 'executed'
        }
        return status_map.get(state, 'active')

    async def get_voting_power(self, voter_address: str) -> int:
        """Get voting power for an address"""
        try:
            # Get voting power from blockchain (this would be implemented in the DAO contract)
            # For now, return a mock value based on token holdings
            from .token_manager import token_manager

            # Voting power based on AgriCredit token balance
            balance = await token_manager.get_token_balance('agricredit', voter_address)
            voting_power = int(balance * 100)  # 1 AgriCredit = 100 voting power

            return voting_power

        except Exception as e:
            logger.error("Voting power calculation failed", voter_address=voter_address, error=str(e))
            return 0

    async def get_proposal_votes(self, proposal_id: int) -> Dict[str, Any]:
        """Get voting results for a proposal"""
        try:
            cache_key = f"proposal_votes:{proposal_id}"
            cached = await cache.get(cache_key)
            if cached:
                return cached

            # Get votes from database
            db = next(get_db())
            votes = db.query(GovernanceVote).filter(
                GovernanceVote.proposal_id == proposal_id
            ).all()

            for_votes = 0
            against_votes = 0
            abstain_votes = 0

            vote_details = []
            for vote in votes:
                if vote.support:
                    for_votes += vote.voting_power
                else:
                    against_votes += vote.voting_power

                vote_details.append({
                    'voter': vote.voter_address,
                    'support': vote.support,
                    'voting_power': vote.voting_power,
                    'reason': vote.reason,
                    'timestamp': vote.created_at.isoformat()
                })

            result = {
                'proposal_id': proposal_id,
                'for_votes': for_votes,
                'against_votes': against_votes,
                'abstain_votes': abstain_votes,
                'total_votes': for_votes + against_votes + abstain_votes,
                'vote_count': len(votes),
                'votes': vote_details
            }

            # Cache for 1 minute
            await cache.set(cache_key, result, expire=60)

            return result

        except Exception as e:
            logger.error("Proposal votes retrieval failed", proposal_id=proposal_id, error=str(e))
            return {}

    async def delegate_votes(self, delegator_address: str, delegate_address: str) -> Dict[str, Any]:
        """Delegate voting power to another address"""
        try:
            # This would call a delegate function on the DAO contract
            # For now, we'll store delegation in cache/database
            delegation_key = f"delegation:{delegator_address}"

            delegation_data = {
                'delegator': delegator_address,
                'delegate': delegate_address,
                'timestamp': datetime.utcnow().isoformat()
            }

            await cache.set(delegation_key, delegation_data, expire=365*24*3600)  # 1 year

            logger.info("Voting power delegated",
                       delegator=delegator_address,
                       delegate=delegate_address)

            return {
                'delegator': delegator_address,
                'delegate': delegate_address,
                'status': 'delegated'
            }

        except Exception as e:
            logger.error("Vote delegation failed",
                        delegator=delegator_address, delegate=delegate_address, error=str(e))
            raise

    async def get_governance_stats(self) -> Dict[str, Any]:
        """Get overall governance statistics"""
        try:
            db = next(get_db())

            total_proposals = db.query(GovernanceProposal).count()
            active_proposals = db.query(GovernanceProposal).filter(
                GovernanceProposal.state == 'active'
            ).count()
            total_votes = db.query(GovernanceVote).count()

            # Get recent activity
            recent_proposals = db.query(GovernanceProposal)\
                                .order_by(GovernanceProposal.created_at.desc())\
                                .limit(5).all()

            stats = {
                'total_proposals': total_proposals,
                'active_proposals': active_proposals,
                'total_votes': total_votes,
                'recent_proposals': [
                    {
                        'id': p.proposal_id,
                        'title': p.title,
                        'state': p.state,
                        'created_at': p.created_at.isoformat()
                    } for p in recent_proposals
                ]
            }

            return stats

        except Exception as e:
            logger.error("Governance stats retrieval failed", error=str(e))
            return {}

    async def _cache_proposal(self, proposal):
        """Cache proposal data"""
        proposal_data = {
            'id': proposal.id,
            'proposal_id': proposal.proposal_id,
            'proposer': proposal.proposer_address,
            'title': proposal.title,
            'description': proposal.description,
            'state': proposal.state,
            'created_at': proposal.created_at.isoformat(),
            'transaction_hash': proposal.transaction_hash
        }

        await cache.set(f"proposal:{proposal.proposal_id}", proposal_data, expire=300)

    async def _update_proposal_votes(self, proposal_id: int):
        """Update cached vote data for a proposal"""
        # Clear vote cache to force refresh
        await cache.delete(f"proposal_votes:{proposal_id}")

# Global governance manager instance
governance_manager = GovernanceManager()