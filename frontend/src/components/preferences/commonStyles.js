export const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      '&.Mui-focused fieldset': {
        borderColor: '#2ecc71',
        borderWidth: '1px'
      },
      '&:hover fieldset': {
        borderColor: '#e0e0e0'
      }
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#6b59cc'
    },
    mb: 2
  };
  
  export const selectStyles = {
    ...inputStyles,
    '& .MuiSelect-select': {
      padding: '10px 14px'
    }
  };
  
  export const autocompleteStyles = {
    ...inputStyles,
    '& .MuiAutocomplete-inputRoot': {
      padding: '4px 8px'
    }
  };