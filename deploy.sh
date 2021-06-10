


git worktree add dist gh-pages
./node_modules/.bin/rollup -c
cp base.css dist
cp index.html dist
cp bundle.js dist
cd dist
git add --all
git commit -m "Deploy updates"
git push origin gh-pages
cd ..
git worktree remove dist

