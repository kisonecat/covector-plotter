./node_modules/.bin/rollup -c
# mkdir dist
cp base.css dist
cp index.html dist
cp bundle.js dist
# push-dir --dir=build --branch=gh-pages
./node_modules/.bin/push-dir --dir=dist --branch=gh-pages
