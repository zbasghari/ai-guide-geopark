import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import frontmatter


@dataclass
class KnowledgeItem:
    id: str
    title: str
    category: str
    content: str
    tags: List[str]
    file_path: str
    metadata: Dict[str, Any]


class KnowledgeBase:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.items: List[KnowledgeItem] = []
        self._load_all()
    
    def _load_all(self):
        """Load all markdown files from knowledge base directories."""
        categories = [
            "geosites", "attractions", "routes", 
            "facilities", "rules", "faq"
        ]
        
        for category in categories:
            cat_path = self.base_path / category
            if cat_path.exists():
                for md_file in cat_path.glob("*.md"):
                    try:
                        item = self._parse_markdown(md_file, category)
                        if item:
                            self.items.append(item)
                    except Exception as e:
                        print(f"Error loading {md_file}: {e}")
    
    def _parse_markdown(self, file_path: Path, category: str) -> Optional[KnowledgeItem]:
        """Parse a markdown file with frontmatter."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)
            
            # Extract metadata from frontmatter
            item_id = post.get('id', file_path.stem)
            title = post.get('title', file_path.stem)
            tags = post.get('tags', [])
            metadata = {k: v for k, v in post.metadata.items() 
                       if k not in ['id', 'title', 'tags', 'category']}
            
            # Content is the markdown body
            content = post.content.strip()
            
            return KnowledgeItem(
                id=item_id,
                title=title,
                category=category,
                content=content,
                tags=tags,
                file_path=str(file_path.relative_to(self.base_path)),
                metadata=metadata
            )
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None
    
    def search(self, query: str, top_k: int = 5) -> List[KnowledgeItem]:
        """Simple keyword-based search. Can be replaced with vector search later."""
        query_lower = query.lower()
        query_words = set(re.findall(r'\w+', query_lower))
        
        scored_items = []
        for item in self.items:
            score = 0
            # Search in title
            title_words = set(re.findall(r'\w+', item.title.lower()))
            score += len(query_words & title_words) * 3
            
            # Search in tags
            tag_words = set()
            for tag in item.tags:
                tag_words.update(re.findall(r'\w+', tag.lower()))
            score += len(query_words & tag_words) * 2
            
            # Search in content (first 1000 chars for speed)
            content_words = set(re.findall(r'\w+', item.content[:1000].lower()))
            score += len(query_words & content_words)
            
            # Search in category
            if query_lower in item.category.lower():
                score += 5
            
            if score > 0:
                scored_items.append((score, item))
        
        # Sort by score descending
        scored_items.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored_items[:top_k]]
    
    def get_by_id(self, item_id: str) -> Optional[KnowledgeItem]:
        """Get a specific item by ID."""
        for item in self.items:
            if item.id == item_id:
                return item
        return None
    
    def get_all(self) -> List[KnowledgeItem]:
        """Get all items."""
        return self.items
    
    def get_by_category(self, category: str) -> List[KnowledgeItem]:
        """Get items by category."""
        return [item for item in self.items if item.category == category]


# Global instance (initialized in main.py)
knowledge_base: Optional[KnowledgeBase] = None


def init_knowledge_base(base_path: str) -> KnowledgeBase:
    """Initialize the global knowledge base."""
    global knowledge_base
    knowledge_base = KnowledgeBase(base_path)
    return knowledge_base


def get_knowledge_base() -> KnowledgeBase:
    """Get the global knowledge base instance."""
    if knowledge_base is None:
        raise RuntimeError("Knowledge base not initialized. Call init_knowledge_base first.")
    return knowledge_base