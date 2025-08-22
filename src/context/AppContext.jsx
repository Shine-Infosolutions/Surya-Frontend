import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isSeller, setSeller] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false); // NEW: global loading

  const [theme, setTheme] = useState("light"); // NEW: theme toggle
  const navigate = useNavigate();
  

  // ✅ Wrapper for toast
  // const setToast = (toastObj) => {
  //   setToastState(toastObj);
  //   if (toastObj) {
  //     setTimeout(() => {
  //       setToastState(null);
  //     }, 3000); // 3 sec baad remove
  //   }
  // };

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Sales Report", path: "/sales" },
    { name: "Purchase Report", path: "/purchase" },
    { name: "Stock Report", path: "/stock" },
    { name: "Expiry Report", path: "/expiry" },
    { name: "User Management", path: "/users" },
  ];

  const logout = () => {
    setUser(null);
    navigate("/login");
  };

  // ✅ Items fetch
    useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await axios.get("/api/items"); // or your correct endpoint
        setItems(data);
      } catch (err) {
        setItems([]);
      }
    };
    fetchItems();
  }, []);


  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setSeller,
    menuItems,
    logout,
    axios,
    medicines,
    setMedicines,
    loading, // NEW
    setLoading, // NEW

  
    theme, // NEW
    setTheme, // NEW
    toggleTheme, // NEW 
    items,
  };

  return (
    <AppContext.Provider value={value}>

      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
