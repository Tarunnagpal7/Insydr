import asyncio
import cloudinary
import cloudinary.uploader
from app.core.config import settings

# Initialize Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

async def upload_file(file_path: str, public_id: str = None) -> dict:
    """
    Upload a file to Cloudinary asynchronously.
    Uses upload_large for chunked uploads to handle bigger files.
    """
    try:
        # Use 'raw' resource type for PDFs to preserve the original file
        # 'auto' sometimes converts PDFs to images which can fail for large/complex PDFs
        res_type = "raw"
        
        # Use upload_large for chunked uploads - handles files > 100MB
        # chunk_size is in bytes (6MB chunks is a good balance)
        response = await asyncio.to_thread(
            cloudinary.uploader.upload_large,
            file_path,
            public_id=public_id,
            resource_type=res_type,
            type="upload", 
            access_mode="public",
            chunk_size=6000000,  # 6MB chunks
            timeout=300  # 5 minute timeout
        )
        return response
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise e


async def upload_avatar(file_path: str, public_id: str = None) -> dict:
    """
    Upload an avatar image to Cloudinary.
    Uses 'image' resource type with transformations for consistent sizing.
    """
    try:
        response = await asyncio.to_thread(
            cloudinary.uploader.upload,
            file_path,
            public_id=public_id,
            resource_type="image",
            folder="insydr/avatars",
            transformation=[
                {"width": 256, "height": 256, "crop": "fill", "gravity": "face"},
                {"quality": "auto:good", "fetch_format": "auto"}
            ],
            overwrite=True,
            timeout=60
        )
        return response
    except Exception as e:
        print(f"Cloudinary avatar upload error: {e}")
        raise e


def delete_file(public_id: str, resource_type: str = "raw") -> dict:
    """
    Delete a file from Cloudinary.
    """
    try:
        response = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return response
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        raise e


async def delete_file_async(public_id: str, resource_type: str = "raw") -> dict:
    """
    Delete a file from Cloudinary asynchronously.
    """
    try:
        response = await asyncio.to_thread(
            cloudinary.uploader.destroy,
            public_id,
            resource_type=resource_type
        )
        return response
    except Exception as e:
        print(f"Cloudinary async delete error: {e}")
        raise e

