import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../shared/types';
import { setDarkMode } from '../store/slices/uiSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  const toggleDarkMode = () => {
    dispatch(setDarkMode(!darkMode));
  };

  return {
    darkMode,
    toggleDarkMode,
  };
}; 