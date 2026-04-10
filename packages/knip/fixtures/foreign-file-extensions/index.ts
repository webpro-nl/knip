// Test imports with custom foreign file extensions
import './style.css';           // Should NOT be unresolved (in foreignFileExtensions)
import './icon.xyz';            // Should NOT be unresolved (in foreignFileExtensions)
import './data.custom';         // Should NOT be unresolved (in foreignFileExtensions)
import './unknown.unknown';     // Should be unresolved (NOT in foreignFileExtensions)
import './missing-file';        // Should be unresolved (no extension)
