import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import structlog
import json

from .blockchain import blockchain_service
from .cache import cache
from .ipfs import IPFSService
from ..database.config import get_db
from ..database.models import User, FarmNFT, HarvestRecord

logger = structlog.get_logger()

class NFTFarmingManager:
    """Comprehensive NFT farming management for AgriCredit platform"""

    def __init__(self):
        self.ipfs_service = IPFSService()

    async def mint_farm_nft(self, farmer_address: str, farm_name: str, location: str,
                          size: float, crop_type: str, expected_yield: float,
                          soil_type: Optional[str] = None, irrigation_type: Optional[str] = None,
                          certifications: Optional[List[str]] = None) -> Dict[str, Any]:
        """Mint a comprehensive farm NFT with metadata"""
        try:
            # Create metadata
            metadata = {
                "name": f"{farm_name} - {crop_type}",
                "description": f"Farm NFT representing {size} hectares of {crop_type} cultivation in {location}",
                "image": "",  # Will be set after IPFS upload
                "attributes": [
                    {"trait_type": "Farm Name", "value": farm_name},
                    {"trait_type": "Location", "value": location},
                    {"trait_type": "Size (hectares)", "value": size},
                    {"trait_type": "Crop Type", "value": crop_type},
                    {"trait_type": "Expected Yield (tons)", "value": expected_yield},
                    {"trait_type": "Soil Type", "value": soil_type or "Unknown"},
                    {"trait_type": "Irrigation Type", "value": irrigation_type or "Unknown"},
                    {"trait_type": "Certifications", "value": ", ".join(certifications) if certifications else "None"}
                ],
                "farmer": farmer_address,
                "minted_at": datetime.utcnow().isoformat(),
                "expected_yield": expected_yield,
                "actual_yield": 0,
                "harvests": []
            }

            # Upload metadata to IPFS
            metadata_uri = await self._upload_metadata_to_ipfs(metadata)

            # Update metadata with IPFS image URL (placeholder for now)
            metadata["image"] = f"ipfs://{metadata_uri}/image.png"

            # Re-upload updated metadata
            final_metadata_uri = await self._upload_metadata_to_ipfs(metadata)

            # Create database record first
            db = next(get_db())
            farm_nft = FarmNFT(
                farmer_address=farmer_address,
                farm_name=farm_name,
                location=location,
                size=size,
                crop_type=crop_type,
                expected_yield=expected_yield,
                soil_type=soil_type,
                irrigation_type=irrigation_type,
                certifications=certifications or [],
                metadata_uri=final_metadata_uri,
                status='minting'
            )
            db.add(farm_nft)
            db.commit()
            db.refresh(farm_nft)

            # Mint NFT on blockchain
            result = await blockchain_service.mint_farm_nft(
                farmer=farmer_address,
                farm_name=farm_name,
                location=location,
                size=size,
                crop_type=crop_type,
                expected_yield=expected_yield,
                metadata_uri=final_metadata_uri
            )

            # Update database with token ID and transaction hash
            farm_nft.token_id = result.get('token_id')
            farm_nft.transaction_hash = result.get('tx_hash')
            farm_nft.status = 'minted'
            db.commit()

            # Cache NFT data
            await self._cache_farm_nft(farm_nft)

            logger.info("Farm NFT minted",
                       farmer=farmer_address,
                       farm_name=farm_name,
                       token_id=result.get('token_id'),
                       tx_hash=result.get('tx_hash'))

            return {
                'token_id': result.get('token_id'),
                'tx_hash': result.get('tx_hash'),
                'metadata_uri': final_metadata_uri,
                'status': 'minted'
            }

        except Exception as e:
            logger.error("Farm NFT minting failed",
                        farmer=farmer_address, farm_name=farm_name, error=str(e))
            raise

    async def record_harvest(self, token_id: int, actual_yield: float,
                           harvest_date: Optional[datetime] = None,
                           quality_grade: Optional[str] = None,
                           notes: Optional[str] = None) -> Dict[str, Any]:
        """Record harvest data for a farm NFT"""
        try:
            harvest_date = harvest_date or datetime.utcnow()

            # Create database record
            db = next(get_db())
            harvest = HarvestRecord(
                token_id=token_id,
                actual_yield=actual_yield,
                harvest_date=harvest_date,
                quality_grade=quality_grade,
                notes=notes
            )
            db.add(harvest)
            db.commit()

            # Record harvest on blockchain
            result = await blockchain_service.record_harvest(token_id, actual_yield)

            # Update harvest record
            harvest.transaction_hash = result.get('tx_hash')
            db.commit()

            # Update NFT metadata with harvest data
            await self._update_nft_metadata_with_harvest(token_id, harvest)

            # Update cached NFT data
            await self._update_cached_nft_yield(token_id, actual_yield)

            logger.info("Harvest recorded",
                       token_id=token_id,
                       actual_yield=actual_yield,
                       tx_hash=result.get('tx_hash'))

            return {
                'harvest_id': harvest.id,
                'token_id': token_id,
                'tx_hash': result.get('tx_hash'),
                'actual_yield': actual_yield,
                'status': 'recorded'
            }

        except Exception as e:
            logger.error("Harvest recording failed",
                        token_id=token_id, actual_yield=actual_yield, error=str(e))
            raise

    async def get_farm_nft(self, token_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed farm NFT information"""
        try:
            # Try cache first
            cache_key = f"farm_nft:{token_id}"
            cached = await cache.get(cache_key)
            if cached:
                return cached

            # Get from database
            db = next(get_db())
            nft = db.query(FarmNFT).filter(FarmNFT.token_id == token_id).first()

            if not nft:
                return None

            # Get harvest records
            harvests = db.query(HarvestRecord).filter(
                HarvestRecord.token_id == token_id
            ).order_by(HarvestRecord.harvest_date.desc()).all()

            # Get blockchain data
            blockchain_data = await blockchain_service.get_farm_nft(token_id)

            # Calculate total actual yield
            total_actual_yield = sum(h.actual_yield for h in harvests)

            # Combine data
            nft_data = {
                'id': nft.id,
                'token_id': nft.token_id,
                'farmer_address': nft.farmer_address,
                'farm_name': nft.farm_name,
                'location': nft.location,
                'size': nft.size,
                'crop_type': nft.crop_type,
                'expected_yield': nft.expected_yield,
                'total_actual_yield': total_actual_yield,
                'soil_type': nft.soil_type,
                'irrigation_type': nft.irrigation_type,
                'certifications': nft.certifications,
                'metadata_uri': nft.metadata_uri,
                'status': nft.status,
                'minted_at': nft.created_at.isoformat(),
                'transaction_hash': nft.transaction_hash,
                'harvests': [
                    {
                        'id': h.id,
                        'actual_yield': h.actual_yield,
                        'harvest_date': h.harvest_date.isoformat(),
                        'quality_grade': h.quality_grade,
                        'notes': h.notes,
                        'transaction_hash': h.transaction_hash
                    } for h in harvests
                ],
                'blockchain_data': blockchain_data,
                'yield_efficiency': (total_actual_yield / nft.expected_yield) if nft.expected_yield > 0 else 0
            }

            # Cache for 10 minutes
            await cache.set(cache_key, nft_data, expire=600)

            return nft_data

        except Exception as e:
            logger.error("Farm NFT retrieval failed", token_id=token_id, error=str(e))
            return None

    async def get_farmer_nfts(self, farmer_address: str) -> List[Dict[str, Any]]:
        """Get all NFTs owned by a farmer"""
        try:
            db = next(get_db())
            nfts = db.query(FarmNFT).filter(
                FarmNFT.farmer_address == farmer_address
            ).order_by(FarmNFT.created_at.desc()).all()

            result = []
            for nft in nfts:
                # Get basic info with yield summary
                harvests = db.query(HarvestRecord).filter(
                    HarvestRecord.token_id == nft.token_id
                ).all()

                total_yield = sum(h.actual_yield for h in harvests)

                nft_data = {
                    'token_id': nft.token_id,
                    'farm_name': nft.farm_name,
                    'location': nft.location,
                    'crop_type': nft.crop_type,
                    'size': nft.size,
                    'expected_yield': nft.expected_yield,
                    'total_actual_yield': total_yield,
                    'status': nft.status,
                    'created_at': nft.created_at.isoformat(),
                    'yield_efficiency': (total_yield / nft.expected_yield) if nft.expected_yield > 0 else 0
                }
                result.append(nft_data)

            return result

        except Exception as e:
            logger.error("Farmer NFTs retrieval failed", farmer=farmer_address, error=str(e))
            return []

    async def get_farm_analytics(self, farmer_address: Optional[str] = None) -> Dict[str, Any]:
        """Get farming analytics and statistics"""
        try:
            db = next(get_db())

            # Base query
            query = db.query(FarmNFT)
            if farmer_address:
                query = query.filter(FarmNFT.farmer_address == farmer_address)

            nfts = query.all()

            total_farms = len(nfts)
            total_area = sum(nft.size for nft in nfts)
            total_expected_yield = sum(nft.expected_yield for nft in nfts)

            # Calculate actual yields
            total_actual_yield = 0
            crop_distribution = {}
            location_distribution = {}

            for nft in nfts:
                harvests = db.query(HarvestRecord).filter(
                    HarvestRecord.token_id == nft.token_id
                ).all()

                actual_yield = sum(h.actual_yield for h in harvests)
                total_actual_yield += actual_yield

                # Update distributions
                crop_distribution[nft.crop_type] = crop_distribution.get(nft.crop_type, 0) + 1
                location_distribution[nft.location] = location_distribution.get(nft.location, 0) + 1

            analytics = {
                'total_farms': total_farms,
                'total_area_hectares': total_area,
                'total_expected_yield': total_expected_yield,
                'total_actual_yield': total_actual_yield,
                'average_yield_efficiency': (total_actual_yield / total_expected_yield) if total_expected_yield > 0 else 0,
                'crop_distribution': crop_distribution,
                'location_distribution': location_distribution,
                'farms_by_status': {
                    status: len([nft for nft in nfts if nft.status == status])
                    for status in ['minting', 'minted', 'harvested']
                }
            }

            return analytics

        except Exception as e:
            logger.error("Farm analytics retrieval failed", error=str(e))
            return {}

    async def update_nft_metadata(self, token_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update farm NFT metadata"""
        try:
            db = next(get_db())
            nft = db.query(FarmNFT).filter(FarmNFT.token_id == token_id).first()

            if not nft:
                raise ValueError(f"NFT {token_id} not found")

            # Update allowed fields
            allowed_updates = ['farm_name', 'location', 'soil_type', 'irrigation_type', 'certifications']
            for field in allowed_updates:
                if field in updates:
                    setattr(nft, field, updates[field])

            db.commit()

            # Update metadata on IPFS
            await self._update_nft_metadata_on_ipfs(nft)

            # Clear cache
            await cache.delete(f"farm_nft:{token_id}")

            logger.info("NFT metadata updated", token_id=token_id, updates=updates)

            return {'token_id': token_id, 'status': 'updated'}

        except Exception as e:
            logger.error("NFT metadata update failed", token_id=token_id, error=str(e))
            raise

    async def _upload_metadata_to_ipfs(self, metadata: Dict[str, Any]) -> str:
        """Upload metadata to IPFS"""
        try:
            metadata_json = json.dumps(metadata, indent=2)
            # In production, this would upload to IPFS
            # For now, return a mock IPFS hash
            import hashlib
            metadata_hash = hashlib.sha256(metadata_json.encode()).hexdigest()
            return f"Qm{metadata_hash[:44]}"  # Mock IPFS hash
        except Exception as e:
            logger.error("IPFS metadata upload failed", error=str(e))
            return ""

    async def _update_nft_metadata_with_harvest(self, token_id: int, harvest: HarvestRecord):
        """Update NFT metadata with new harvest data"""
        try:
            # This would update the IPFS metadata with harvest information
            # Implementation depends on IPFS service capabilities
            pass
        except Exception as e:
            logger.error("NFT metadata harvest update failed", token_id=token_id, error=str(e))

    async def _update_cached_nft_yield(self, token_id: int, additional_yield: float):
        """Update cached NFT yield data"""
        try:
            cache_key = f"farm_nft:{token_id}"
            cached_data = await cache.get(cache_key)
            if cached_data:
                cached_data['total_actual_yield'] += additional_yield
                cached_data['yield_efficiency'] = (
                    cached_data['total_actual_yield'] / cached_data['expected_yield']
                ) if cached_data['expected_yield'] > 0 else 0
                await cache.set(cache_key, cached_data, expire=600)
        except Exception as e:
            logger.error("Cached NFT yield update failed", token_id=token_id, error=str(e))

    async def _cache_farm_nft(self, nft: FarmNFT):
        """Cache farm NFT data"""
        # Basic caching - full data will be cached on first retrieval
        pass

    async def _update_nft_metadata_on_ipfs(self, nft: FarmNFT):
        """Update NFT metadata on IPFS after database changes"""
        # Implementation for updating IPFS metadata
        pass

# Global NFT farming manager instance
nft_farming_manager = NFTFarmingManager()