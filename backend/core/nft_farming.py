from typing import Dict, Any, List, Optional
from datetime import datetime
from .blockchain import blockchain_service

class NFTFarmingManager:
    """NFT Farming Manager for tokenized agricultural assets"""

    def __init__(self):
        self.farm_nfts = {}

    async def mint_farm_nft(self, farmer_address: str, farm_name: str, location: str,
                          size: float, crop_type: str, expected_yield: float,
                          soil_type: Optional[str] = None, irrigation_type: Optional[str] = None,
                          certifications: Optional[List[str]] = None) -> Dict[str, Any]:
        """Mint an NFT representing farm ownership"""
        if not blockchain_service.is_connected() or 'NFTFarming' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or NFTFarming contract not loaded")

        contract = blockchain_service.contracts['NFTFarming']

        # Prepare metadata
        metadata = {
            "name": farm_name,
            "description": f"Farm NFT for {farm_name} in {location}",
            "attributes": [
                {"trait_type": "Location", "value": location},
                {"trait_type": "Size", "value": f"{size} hectares"},
                {"trait_type": "Crop Type", "value": crop_type},
                {"trait_type": "Expected Yield", "value": f"{expected_yield} tons"},
                {"trait_type": "Soil Type", "value": soil_type or "Unknown"},
                {"trait_type": "Irrigation", "value": irrigation_type or "Unknown"}
            ]
        }

        if certifications:
            metadata["attributes"].extend([
                {"trait_type": "Certification", "value": cert} for cert in certifications
            ])

        # Convert to JSON string
        import json
        metadata_json = json.dumps(metadata)

        # Mint NFT on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.mintFarmNFT(farmer_address, metadata_json),
            farmer_address
        )

        token_id = tx_result.get('token_id')

        # Store NFT data locally
        nft_data = {
            'token_id': token_id,
            'farmer_address': farmer_address,
            'farm_name': farm_name,
            'location': location,
            'size': size,
            'crop_type': crop_type,
            'expected_yield': expected_yield,
            'soil_type': soil_type,
            'irrigation_type': irrigation_type,
            'certifications': certifications or [],
            'metadata': metadata,
            'minted_at': datetime.utcnow(),
            'harvests': []
        }

        self.farm_nfts[token_id] = nft_data

        return {
            'token_id': token_id,
            'status': 'minted',
            'metadata': metadata
        }

    async def record_harvest(self, token_id: int, actual_yield: float,
                           harvest_date: Optional[datetime] = None,
                           quality_grade: Optional[str] = None,
                           notes: Optional[str] = None) -> Dict[str, Any]:
        """Record actual harvest data for an NFT"""
        if not blockchain_service.is_connected() or 'NFTFarming' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or NFTFarming contract not loaded")

        contract = blockchain_service.contracts['NFTFarming']

        # Record harvest on blockchain
        harvest_date_timestamp = int((harvest_date or datetime.utcnow()).timestamp())

        tx_result = await blockchain_service._send_transaction(
            contract.functions.recordHarvest(token_id, int(actual_yield * 100), harvest_date_timestamp),
            blockchain_service.account.address  # Use service account
        )

        # Update local NFT data
        if token_id in self.farm_nfts:
            harvest_record = {
                'actual_yield': actual_yield,
                'harvest_date': harvest_date or datetime.utcnow(),
                'quality_grade': quality_grade,
                'notes': notes,
                'recorded_at': datetime.utcnow()
            }

            self.farm_nfts[token_id]['harvests'].append(harvest_record)

        return {
            'token_id': token_id,
            'harvest_yield': actual_yield,
            'status': 'recorded'
        }

    async def get_farm_nft(self, token_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed farm NFT information"""
        if not blockchain_service.is_connected() or 'NFTFarming' not in blockchain_service.contracts:
            return self.farm_nfts.get(token_id)

        contract = blockchain_service.contracts['NFTFarming']

        try:
            # Get NFT data from blockchain
            nft_data = contract.functions.getFarmNFT(token_id).call()

            # Combine with local data
            local_data = self.farm_nfts.get(token_id, {})

            return {
                'token_id': token_id,
                'owner': nft_data[0],
                'farm_name': local_data.get('farm_name', ''),
                'location': local_data.get('location', ''),
                'size': local_data.get('size', 0),
                'crop_type': local_data.get('crop_type', ''),
                'expected_yield': local_data.get('expected_yield', 0),
                'actual_yield': sum(h.get('actual_yield', 0) for h in local_data.get('harvests', [])),
                'harvest_count': len(local_data.get('harvests', [])),
                'metadata': local_data.get('metadata', {}),
                'certifications': local_data.get('certifications', []),
                'minted_at': local_data.get('minted_at'),
                'last_harvest': max((h['harvest_date'] for h in local_data.get('harvests', [])), default=None)
            }

        except Exception as e:
            print(f"Error getting farm NFT {token_id}: {e}")
            return self.farm_nfts.get(token_id)

    async def get_farmer_nfts(self, farmer_address: str) -> List[Dict[str, Any]]:
        """Get all NFTs owned by a farmer"""
        if not blockchain_service.is_connected() or 'NFTFarming' not in blockchain_service.contracts:
            # Return from local storage
            return [nft for nft in self.farm_nfts.values() if nft['farmer_address'] == farmer_address]

        contract = blockchain_service.contracts['NFTFarming']

        try:
            # Get token count for farmer
            balance = contract.functions.balanceOf(farmer_address).call()

            nfts = []
            for i in range(balance):
                token_id = contract.functions.tokenOfOwnerByIndex(farmer_address, i).call()
                nft_data = await self.get_farm_nft(token_id)
                if nft_data:
                    nfts.append(nft_data)

            return nfts

        except Exception as e:
            print(f"Error getting farmer NFTs for {farmer_address}: {e}")
            return [nft for nft in self.farm_nfts.values() if nft['farmer_address'] == farmer_address]

    async def get_farm_analytics(self, farmer_address: str) -> Dict[str, Any]:
        """Get farming analytics for a farmer"""
        farmer_nfts = await self.get_farmer_nfts(farmer_address)

        total_farms = len(farmer_nfts)
        total_area = sum(nft.get('size', 0) for nft in farmer_nfts)
        total_expected_yield = sum(nft.get('expected_yield', 0) for nft in farmer_nfts)
        total_actual_yield = sum(nft.get('actual_yield', 0) for nft in farmer_nfts)

        # Calculate yield efficiency
        yield_efficiency = (total_actual_yield / total_expected_yield * 100) if total_expected_yield > 0 else 0

        # Get recent harvests
        recent_harvests = []
        for nft in farmer_nfts:
            for harvest in nft.get('harvests', []):
                recent_harvests.append({
                    'token_id': nft['token_id'],
                    'farm_name': nft['farm_name'],
                    **harvest
                })

        # Sort by harvest date
        recent_harvests.sort(key=lambda x: x['harvest_date'], reverse=True)
        recent_harvests = recent_harvests[:10]  # Last 10 harvests

        return {
            'farmer_address': farmer_address,
            'total_farms': total_farms,
            'total_area_hectares': total_area,
            'total_expected_yield': total_expected_yield,
            'total_actual_yield': total_actual_yield,
            'yield_efficiency_percent': round(yield_efficiency, 2),
            'recent_harvests': recent_harvests,
            'certifications': list(set(
                cert for nft in farmer_nfts
                for cert in nft.get('certifications', [])
            ))
        }

    async def update_nft_metadata(self, token_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update farm NFT metadata"""
        if token_id not in self.farm_nfts:
            raise Exception(f"NFT {token_id} not found")

        # Update local metadata
        nft_data = self.farm_nfts[token_id]

        # Update allowed fields
        allowed_updates = ['farm_name', 'location', 'crop_type', 'soil_type', 'irrigation_type', 'certifications']
        for field in allowed_updates:
            if field in updates:
                nft_data[field] = updates[field]

        # Update metadata object
        metadata = nft_data['metadata']
        metadata['name'] = nft_data['farm_name']
        metadata['description'] = f"Farm NFT for {nft_data['farm_name']} in {nft_data['location']}"

        # Update attributes
        attributes = metadata['attributes']
        for attr in attributes:
            trait_type = attr['trait_type']
            if trait_type == 'Location':
                attr['value'] = nft_data['location']
            elif trait_type == 'Crop Type':
                attr['value'] = nft_data['crop_type']
            elif trait_type == 'Soil Type':
                attr['value'] = nft_data.get('soil_type', 'Unknown')
            elif trait_type == 'Irrigation':
                attr['value'] = nft_data.get('irrigation_type', 'Unknown')

        # Update certifications
        # Remove old certification attributes
        attributes[:] = [attr for attr in attributes if attr['trait_type'] != 'Certification']

        # Add new certification attributes
        for cert in nft_data.get('certifications', []):
            attributes.append({"trait_type": "Certification", "value": cert})

        return {
            'token_id': token_id,
            'status': 'updated',
            'metadata': metadata
        }

# Global NFT farming manager instance
nft_farming_manager = NFTFarmingManager()