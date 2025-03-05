import { useEffect, useState } from "react";
import { getCategories } from "../apiRequests";
import { useMediaQuery } from "react-responsive";

function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <div className="mb-3">

      {isMobile ? (
        <select
          className="form-select"
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${selectedCategory === "" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => onSelectCategory("")}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`btn btn-sm ${selectedCategory === category.id ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryFilter;
