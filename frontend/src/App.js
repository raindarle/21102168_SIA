import React, { useEffect } from "react";
import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button } from "@mui/material";

// GraphQL Queries
const GET_POSTS = gql`
  query {
    posts {
      id
      title
      content
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

const POST_SUBSCRIPTION = gql`
  subscription {
    postAdded {
      id
      title
      content
    }
  }
`;

const App = () => {
  const { loading, error, data } = useQuery(GET_POSTS);
  const [createPost] = useMutation(CREATE_POST);
  const { data: subscriptionData } = useSubscription(POST_SUBSCRIPTION);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [posts, setPosts] = React.useState([]);

  // Update posts when data is fetched
  useEffect(() => {
    if (data) {
      setPosts(data.posts);
    }
  }, [data]);

  // Update posts when a new post is received via subscription
  useEffect(() => {
    if (subscriptionData) {
      setPosts((prevPosts) => [subscriptionData.postAdded, ...prevPosts]);
    }
  }, [subscriptionData]);

  // Handle form submission
  const handleCreatePost = async () => {
    if (!title || !content) return;
    await createPost({ variables: { title, content } });
    setTitle("");
    setContent("");
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading posts.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Posts</h2>
      
      {/* New Post Form */}
      <div style={{ marginBottom: "20px" }}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginRight: "10px" }} />
        <TextField label="Content" value={content} onChange={(e) => setContent(e.target.value)} style={{ marginRight: "10px" }} />
        <Button variant="contained" color="primary" onClick={handleCreatePost}>
          Add Post
        </Button>
      </div>

      {/* Posts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Title</b></TableCell>
              <TableCell><b>Content</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.id}</TableCell>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.content}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default App;
