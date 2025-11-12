import aiohttp
import json
from typing import Optional, Dict, Any, List
from pathlib import Path
import base64
import hashlib
from .config import settings

class IPFSService:
    """IPFS service for decentralized file storage"""

    def __init__(self, api_url: str = None):
        self.api_url = api_url or settings.IPFS_API_URL
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _ensure_session(self):
        """Ensure HTTP session is available"""
        if self.session is None:
            self.session = aiohttp.ClientSession()

    async def upload_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Upload file to IPFS and return CID"""
        await self._ensure_session()

        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Prepare multipart data
        data = aiohttp.FormData()
        data.add_field('file', open(file_path, 'rb'), filename=file_path.name)

        try:
            async with self.session.post(f"{self.api_url}/api/v0/add", data=data) as response:
                if response.status != 200:
                    raise Exception(f"IPFS upload failed: {response.status}")

                result = await response.json()
                cid = result['Hash']

                # Store metadata if provided
                if metadata:
                    await self._store_metadata(cid, metadata)

                return cid

        except Exception as e:
            raise Exception(f"Failed to upload to IPFS: {e}")

    async def upload_json(self, data: Dict[str, Any]) -> str:
        """Upload JSON data to IPFS"""
        await self._ensure_session()

        json_str = json.dumps(data, sort_keys=True)
        json_bytes = json_str.encode('utf-8')

        # Create a virtual file from JSON
        data = aiohttp.FormData()
        data.add_field('file', json_bytes, filename='data.json')

        try:
            async with self.session.post(f"{self.api_url}/api/v0/add", data=data) as response:
                if response.status != 200:
                    raise Exception(f"IPFS upload failed: {response.status}")

                result = await response.json()
                return result['Hash']

        except Exception as e:
            raise Exception(f"Failed to upload JSON to IPFS: {e}")

    async def download_file(self, cid: str, output_path: str):
        """Download file from IPFS"""
        await self._ensure_session()

        try:
            async with self.session.get(f"{self.api_url}/api/v0/cat?arg={cid}") as response:
                if response.status != 200:
                    raise Exception(f"IPFS download failed: {response.status}")

                with open(output_path, 'wb') as f:
                    async for chunk in response.aiter_bytes():
                        f.write(chunk)

        except Exception as e:
            raise Exception(f"Failed to download from IPFS: {e}")

    async def get_file_info(self, cid: str) -> Dict[str, Any]:
        """Get file information from IPFS"""
        await self._ensure_session()

        try:
            # Get file stat
            async with self.session.get(f"{self.api_url}/api/v0/files/stat?arg=/ipfs/{cid}") as response:
                if response.status != 200:
                    # Fallback to object stat
                    async with self.session.get(f"{self.api_url}/api/v0/object/stat?arg={cid}") as stat_response:
                        if stat_response.status != 200:
                            raise Exception(f"IPFS stat failed: {stat_response.status}")
                        stat_data = await stat_response.json()
                else:
                    stat_data = await response.json()

            # Try to get metadata
            metadata = await self._get_metadata(cid)

            return {
                "cid": cid,
                "size": stat_data.get("Size", 0),
                "cumulative_size": stat_data.get("CumulativeSize", 0),
                "blocks": stat_data.get("NumLinks", 0),
                "type": stat_data.get("Type", "file"),
                "metadata": metadata,
                "url": f"https://ipfs.io/ipfs/{cid}",
                "gateway_url": f"https://gateway.ipfs.io/ipfs/{cid}"
            }

        except Exception as e:
            raise Exception(f"Failed to get file info: {e}")

    async def pin_file(self, cid: str) -> bool:
        """Pin file to local IPFS node"""
        await self._ensure_session()

        try:
            async with self.session.get(f"{self.api_url}/api/v0/pin/add?arg={cid}") as response:
                return response.status == 200
        except Exception:
            return False

    async def unpin_file(self, cid: str) -> bool:
        """Unpin file from local IPFS node"""
        await self._ensure_session()

        try:
            async with self.session.get(f"{self.api_url}/api/v0/pin/rm?arg={cid}") as response:
                return response.status == 200
        except Exception:
            return False

    async def _store_metadata(self, cid: str, metadata: Dict[str, Any]):
        """Store metadata associated with a CID"""
        # Create metadata object
        metadata_obj = {
            "cid": cid,
            "metadata": metadata,
            "timestamp": "2024-01-01T00:00:00Z"  # Would use actual timestamp
        }

        # Upload metadata to IPFS
        metadata_cid = await self.upload_json(metadata_obj)

        # Store mapping (in production, this would be in a database)
        # For now, we'll just return the metadata CID
        return metadata_cid

    async def _get_metadata(self, cid: str) -> Optional[Dict[str, Any]]:
        """Get metadata associated with a CID"""
        # In production, this would query a database for metadata CID
        # For now, return None
        return None

    async def create_nft_metadata(self, name: str, description: str, image_cid: str,
                                attributes: List[Dict[str, Any]]) -> str:
        """Create NFT metadata according to ERC-721 standard"""
        metadata = {
            "name": name,
            "description": description,
            "image": f"ipfs://{image_cid}",
            "attributes": attributes
        }

        return await self.upload_json(metadata)

    async def upload_farm_data(self, farm_data: Dict[str, Any]) -> str:
        """Upload farm data to IPFS for NFT farming"""
        # Add timestamp and validation
        farm_data["timestamp"] = "2024-01-01T00:00:00Z"  # Would use actual timestamp
        farm_data["validated"] = True

        return await self.upload_json(farm_data)

    async def upload_sensor_data(self, sensor_data: List[Dict[str, Any]]) -> str:
        """Upload sensor data batch to IPFS"""
        data_package = {
            "type": "sensor_batch",
            "data": sensor_data,
            "timestamp": "2024-01-01T00:00:00Z",  # Would use actual timestamp
            "count": len(sensor_data)
        }

        return await self.upload_json(data_package)

# Global IPFS service instance
ipfs_service = IPFSService()