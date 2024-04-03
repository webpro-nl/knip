find . -type f \( -name "*.mdx" -o -name "*.md" \) -exec perl -i -pe 's/^(:::)(\w*)(\{?)/"\\$1$2" . ($3 ? "\\$3" : "")/eg' {} +
find . -type f \( -name "*.mdx" -o -name "*.md" \) -exec perl -i -pe 's/(<(TabItem|Card) [^>]*>)/${1}{\/\* \*\/}/g' {} +
