from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from supabase import create_client

from app.core.config import settings
from app.services.resume_service import (
    MAX_FILE_SIZE,
    extract_pdf_text,
    extract_candidate_information
)


router = APIRouter(
    prefix="/api/resumes",
    tags=["Resume Upload"]
)

BUCKET_NAME = "resumes"


@router.post("/parse", status_code=status.HTTP_200_OK)
async def upload_and_parse_resume(
    file: UploadFile = File(...)
):
    # Check file extension
    filename = Path(file.filename or "").name

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # Read the file
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    # Check file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF file must not exceed 5 MB."
        )

    # Check PDF file signature
    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF."
        )

    # Extract text from PDF
    try:
        resume_text = extract_pdf_text(file_bytes)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    # Extract candidate information using Gemini
    try:
        candidate_data = extract_candidate_information(
            resume_text
        )

    except Exception as error:
        print(f"Gemini extraction error: {error}")

        raise HTTPException(
            status_code=502,
            detail="AI extraction failed. Check the backend terminal."
        )

    # Upload original PDF to private Supabase Storage
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase Storage configuration is missing."
        )

    storage_path = f"{uuid4()}.pdf"

    try:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )

        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": "application/pdf",
                "upsert": "false"
            }
        )

    except Exception as error:
        print(f"Supabase Storage error: {error}")

        raise HTTPException(
            status_code=502,
            detail="Could not upload the resume to storage."
        )

    # Return extracted data for recruiter review
    return {
        "message": "Resume uploaded and analysed successfully.",
        "filename": filename,
        "storage_path": storage_path,
        "extracted_data": candidate_data
    }
