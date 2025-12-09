import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
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

      const refreshedTags = await tagService.getAllUserTags();
      setAllUserTags(refreshedTags);
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

  const availableTags = allUserTags.filter(
    (tag) => !tags.some((t) => t.id === tag.id)
  );

  return (
    <div className="tags-container">
      {tags.map((tag) => (
        <div key={tag.id} className="tag-item">
          <span>{tag.name}</span>
          <button
            className="tag-remove-btn"
            onClick={() => handleRemoveTag(tag.id)}
            title="Удалить"
          >
            <CancelIcon fontSize="small" />
          </button>
        </div>
      ))}

      {!showInput ? (
        <button
          className="add-tag-btn"
          onClick={() => setShowInput(true)}
          title="Добавить тег"
        >
          <AddCircleOutlineIcon />
        </button>
      ) : (
        <form onSubmit={handleAddTag} className="add-tag-form">
          <input
            type="text"
            className="tag-input"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Тег..."
            list="user-tags-list"
            autoFocus
          />
          <datalist id="user-tags-list">
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>

          <button type="submit" className="tag-action-btn confirm" title="Ок">
            <CheckIcon fontSize="inherit" />
          </button>

          <button
            type="button"
            className="tag-action-btn cancel"
            onClick={() => {
              setShowInput(false);
              setNewTagName("");
            }}
            title="Отмена"
          >
            <CancelIcon fontSize="inherit" />
          </button>
        </form>
      )}
    </div>
  );
};

export default TagManager;
