import json

def main(llm_output: str) -> dict:
    cleaned = llm_output.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    try:
        data = json.loads(cleaned)
        message = data.get("message", "")
        files = data.get("files", [])
        memory_save = data.get("memory_save", "")
    except (json.JSONDecodeError, TypeError):
        message = llm_output
        files = []
        memory_save = ""
        
    notices = []
    if files and len(files) > 0:
        notices.append("※ソースコードをファイルとして添付しました。")
    if memory_save and memory_save.strip() != "":
        notices.append("※新しい内容を長期記憶に保存しました。")
        
    if notices:
        message += "\n\n" + "\n".join(notices)
        
    return {
        "discord_message": message