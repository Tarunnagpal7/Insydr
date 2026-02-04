
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

def upload_file(file_path: str, public_id: str = None) -> dict:
    """
    Upload a file to Cloudinary.
    """
    try:
        # Default to auto, allowing Cloudinary to categorize (PDFs often -> image)
        # This might allow public access if 'Raw' is restricted.
        res_type = "auto"
        # Removed forced raw check
            
        response = cloudinary.uploader.upload(
            file_path,
            public_id=public_id,
            resource_type=res_type,
            type="upload", 
            access_mode="public" 
        )
        return response
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise e

def delete_file(public_id: str, resource_type: str = "image") -> dict:
    """
    Delete a file from Cloudinary.
    """
    try:
        response = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return response
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        raise e
