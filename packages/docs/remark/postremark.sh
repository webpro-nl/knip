find . -type f \( -name "*.mdx" -o -name "*.md" \) -exec perl -i -pe 's/\\/$1/g if /^\\:::/' {} +
find . -type f \( -name "*.mdx" -o -name "*.md" \) -exec perl -i -0777 -pe 's/(<(TabItem|Card) [^>]*>)[\s\n]*\{\/\* \*\/\}/$1/g' {} +
