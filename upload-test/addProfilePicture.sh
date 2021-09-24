curl --location --request POST 'http://localhost:3100/lambda-gq-resolver/auth-none/graphql' \
  --form 'operations="{\"query\":\"mutation uploadImage($picture: Upload!){\\n  uploadImage(picture: $picture)\\n}\"}"' \
  --form 'map="{ \"0\" : [\"variables.picture\"]}"' \
  --form '0=@"picture.jpeg"' &&
  echo "success"
