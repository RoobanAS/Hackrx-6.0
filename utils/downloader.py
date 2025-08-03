import os
import requests

def download_document(url, save_path="temp.pdf"):
    """
    Downloads a document from a given URL and saves it locally.
    """
    response = requests.get(url)
    if response.status_code == 200:
        with open(save_path, "wb") as f:
            f.write(response.content)
        return save_path
    else:
        raise Exception(f"Failed to download document: {url}")
