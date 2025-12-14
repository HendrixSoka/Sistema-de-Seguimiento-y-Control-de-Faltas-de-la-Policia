// App.jsx
import AppRoutes from './routes/Routes';
import Sidebar from './components/SideBar';
import { Box } from '@chakra-ui/react';
import { useLocation,useNavigate } from 'react-router-dom';
import Header from './components/Header';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const rutasSinLayout = ['/login'];
  const sinLayout = rutasSinLayout.includes(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/");
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="#589d50ff"
      w={"100%"}
      minW={"fit-content"}
      overflowX={"auto"}
    >
      {!sinLayout && <Box  minW={"100%"} boxSizing="content-box" > <Header onLogout={handleLogout}  /></Box>}
      {sinLayout ? (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <AppRoutes />
        </Box>
      ) : (
        <Box display="flex" minH="100vh">
          <Sidebar/>
          <Box flex="1" p={6}>
            <AppRoutes />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default App;