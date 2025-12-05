// src/components/book/TagManager.jsx

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import { useEffect, useState } from "react";
import { tagService } from "../../services/tagService";
import "./TagManager.css";

const TagManager = ({ userBookId, initialTags, onTagsUpdate }) => {
  const [tags, setTags] = useState(initialTags || []);
  const [allUserTags, setAllUserTags] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    tagService.getAllUserTags().then(setAllUserTags).catch(console.error);
  }, []);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const updatedUserBook = await tagService.addTagToUserBook(
        userBookId,
        newTagName.trim()
      );
      setTags(updatedUserBook.tags);
      onTagsUpdate(updatedUserBook.tags);
      setNewTagName("");
      setShowInput(false);
    } catch (error) {
      console.error("Не удалось добавить тег", error);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const updatedUserBook = await tagService.removeTagFromUserBook(
        userBookId,
        tagId
      );
      setTags(updatedUserBook.tags);
      onTagsUpdate(updatedUserBook.tags);
    } catch (error) {
      console.error("Не удалось удалить тег", error);
    }
  };

  return (
    <div className="tags-container">
      {tags.map((tag) => (
        <div key={tag.id} className="tag-item">
          <span>{tag.name}</span>
          <button
            className="tag-remove-btn"
            onClick={() => handleRemoveTag(tag.id)}
          >
            <CancelIcon />
          </button>
        </div>
      ))}

      {!showInput ? (
        <button className="add-tag-btn" onClick={() => setShowInput(true)}>
          <AddCircleOutlineIcon />
        </button>
      ) : (
        <form onSubmit={handleAddTag} className="add-tag-form">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Новый тег..."
            list="user-tags-list"
            autoFocus
          />
          <datalist id="user-tags-list">
            {allUserTags.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <button type="submit">Ок</button>
        </form>
      )}
    </div>
  );
};

export default TagManager;
