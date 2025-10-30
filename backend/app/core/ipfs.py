import ipfshttpclient
import json
import base64
import hashlib
from typing import Dict, Any, Optional, List
import structlog
from PIL import Image
import io
import os

logger = structlog.get_logger()

class IPFSService:
    def __init__(self, api_url: str = "http://localhost:5001"):
        self.api_url = api_url
        self.client = None

    def _get_client(self):
        """Get IPFS client with lazy initialization"""
        if self.client is None:
            try:
                self.client = ipfshttpclient.connect(self.api_url)
            except Exception as e:
                logger.error("Failed to connect to IPFS", error=str(e))
                raise Exception("IPFS service unavailable")
        return self.client

    async def upload_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Upload a file to IPFS and return the CID"""
        try:
            client = self._get_client()

            # Add file to IPFS
            result = client.add(file_path)
            cid = result['Hash']

            # If metadata provided, create a directory with file and metadata
            if metadata:
                # Create metadata JSON
                metadata_json = json.dumps(metadata, indent=2)
                metadata_hash = hashlib.sha256(metadata_json.encode()).hexdigest()[:16]

                # Create a directory structure
                files = [
                    {
                        'path': f'file_{metadata_hash}',
                        'content': open(file_path, 'rb')
                    },
                    {
                        'path': f'metadata_{metadata_hash}.json',
                        'content': metadata_json.encode()
                    }
                ]

                # Add directory to IPFS
                dir_result = client.add(files, recursive=True)
                if isinstance(dir_result, list):
                    cid = dir_result[-1]['Hash']  # Directory hash
                else:
                    cid = dir_result['Hash']

            logger.info("File uploaded to IPFS", cid=cid, file_path=file_path)
            return cid

        except Exception as e:
            logger.error("Failed to upload file to IPFS", error=str(e), file_path=file_path)
            raise Exception(f"IPFS upload failed: {str(e)}")

    async def upload_json(self, data: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Upload JSON data to IPFS"""
        try:
            client = self._get_client()

            json_str = json.dumps(data, indent=2, default=str)
            json_bytes = json_str.encode('utf-8')

            if filename:
                files = [{'path': filename, 'content': json_bytes}]
                result = client.add(files)
                if isinstance(result, list):
                    cid = result[0]['Hash']
                else:
                    cid = result['Hash']
            else:
                result = client.add_bytes(json_bytes)
                cid = result

            logger.info("JSON uploaded to IPFS", cid=cid, filename=filename)
            return cid

        except Exception as e:
            logger.error("Failed to upload JSON to IPFS", error=str(e))
            raise Exception(f"IPFS JSON upload failed: {str(e)}")

    async def upload_image(self, image_path: str, resize: Optional[tuple] = None, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Upload an image to IPFS with optional resizing"""
        try:
            # Process image if resizing is requested
            if resize:
                with Image.open(image_path) as img:
                    img = img.resize(resize, Image.Resampling.LANCZOS)
                    # Save to memory
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format=img.format or 'JPEG')
                    img_buffer.seek(0)

                    # Save temporarily
                    temp_path = f"/tmp/resized_{os.path.basename(image_path)}"
                    with open(temp_path, 'wb') as f:
                        f.write(img_buffer.getvalue())
                    upload_path = temp_path
            else:
                upload_path = image_path

            # Upload the image
            cid = await self.upload_file(upload_path, metadata)

            # Clean up temp file if created
            if resize and upload_path.startswith('/tmp/'):
                os.remove(upload_path)

            return cid

        except Exception as e:
            logger.error("Failed to upload image to IPFS", error=str(e), image_path=image_path)
            raise Exception(f"IPFS image upload failed: {str(e)}")

    async def download_file(self, cid: str, output_path: str) -> bool:
        """Download a file from IPFS"""
        try:
            client = self._get_client()

            # Get file from IPFS
            client.get(cid, target=output_path)

            logger.info("File downloaded from IPFS", cid=cid, output_path=output_path)
            return True

        except Exception as e:
            logger.error("Failed to download file from IPFS", error=str(e), cid=cid)
            return False

    async def get_file_info(self, cid: str) -> Dict[str, Any]:
        """Get information about a file on IPFS"""
        try:
            client = self._get_client()

            # Get file stats
            stats = client.object.stat(cid)

            # Try to get data if it's JSON
            try:
                data = client.cat(cid)
                content = data.decode('utf-8')
                try:
                    json_data = json.loads(content)
                    return {
                        'cid': cid,
                        'size': stats['CumulativeSize'],
                        'type': 'json',
                        'data': json_data
                    }
                except json.JSONDecodeError:
                    return {
                        'cid': cid,
                        'size': stats['CumulativeSize'],
                        'type': 'file',
                        'data': content[:100] + '...' if len(content) > 100 else content
                    }
            except:
                return {
                    'cid': cid,
                    'size': stats['CumulativeSize'],
                    'type': 'binary'
                }

        except Exception as e:
            logger.error("Failed to get file info from IPFS", error=str(e), cid=cid)
            return {'error': str(e)}

    async def pin_file(self, cid: str) -> bool:
        """Pin a file to ensure it stays available"""
        try:
            client = self._get_client()
            client.pin.add(cid)
            logger.info("File pinned on IPFS", cid=cid)
            return True
        except Exception as e:
            logger.error("Failed to pin file on IPFS", error=str(e), cid=cid)
            return False

    async def unpin_file(self, cid: str) -> bool:
        """Unpin a file"""
        try:
            client = self._get_client()
            client.pin.rm(cid)
            logger.info("File unpinned from IPFS", cid=cid)
            return True
        except Exception as e:
            logger.error("Failed to unpin file from IPFS", error=str(e), cid=cid)
            return False

    async def create_nft_metadata(self, name: str, description: str, image_cid: str, attributes: List[Dict[str, Any]]) -> str:
        """Create NFT metadata for farm assets"""
        metadata = {
            "name": name,
            "description": description,
            "image": f"ipfs://{image_cid}",
            "attributes": attributes,
            "external_url": f"https://ipfs.io/ipfs/{image_cid}"
        }

        return await self.upload_json(metadata, f"{name.replace(' ', '_')}_metadata.json")

# Global IPFS service instance
ipfs_service = IPFSService()