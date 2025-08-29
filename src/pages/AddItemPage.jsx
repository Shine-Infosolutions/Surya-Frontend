import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddItem from '../component/Item';

function AddItemPage() {
  const navigate = useNavigate();

  const handleItemAdded = () => {
    navigate('/items');
  };
   
  return (
    <div className="w-full h-screen overflow-hidden bg-gray-50">
      <AddItem onItemAdded={handleItemAdded} />
    </div>
  );
}

export default AddItemPage;