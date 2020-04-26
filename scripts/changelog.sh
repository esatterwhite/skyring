#!/user/bin/env bash
printf "# Changelog\n\n"
previous_tag=0

for current_tag in $(git tag --sort=creatordate)
  do
    if [ "$previous_tag" != 0 ];then
      tag_date=$(git log -1 --pretty=format:'%ad' --date=short ${previous_tag})
      printf "## ${previous_tag} (${tag_date})\n\n"
      git log ${current_tag}...${previous_tag} --pretty=format:'* %s [View](https://github.com/esatterwhite/skyring/commit/%H)' | grep -v Merge
      printf "\n\n"
    fi
    previous_tag=${current_tag}
  done
