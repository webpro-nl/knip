// Test imports with default foreign file extensions
import './style.css';           // Should NOT be unresolved (in default foreignFileExtensions)
import './image.png';           // Should NOT be unresolved (in default foreignFileExtensions)
import './data.yaml';           // Should NOT be unresolved (in default foreignFileExtensions)
import './custom.xyz';          // Should be unresolved (NOT in default foreignFileExtensions, file doesn't exist)
import './missing-file';        // Should be unresolved (no extension)
