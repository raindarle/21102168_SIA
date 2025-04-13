import React, { useEffect } from "react";
import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button } from "@mui/material";
import { rabbitmqService } from './services/rabbitmqService';

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
  const { loading, error, data, refetch } = useQuery(GET_POSTS);
  const [createPost] = useMutation(CREATE_POST, {
    onCompleted: () => {
      refetch(); // Refetch posts after mutation
    }
  });
  const { data: subscriptionData } = useSubscription(POST_SUBSCRIPTION, {
    onData: ({ data }) => {
      if (data?.data?.postAdded) {
        setPosts(prevPosts => [data.data.postAdded, ...prevPosts]);
      }
    }
  });

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [posts, setPosts] = React.useState([]);

  // Update posts when data is fetched
  useEffect(() => {
    if (data?.posts) {
      setPosts(data.posts);
    }
  }, [data]);

  // Handle form submission
  const handleCreatePost = async () => {
    if (!title || !content) return;
    try {
      await createPost({ 
        variables: { title, content },
        update: (cache, { data: { createPost } }) => {
          const existingPosts = cache.readQuery({ query: GET_POSTS });
          cache.writeQuery({
            query: GET_POSTS,
            data: {
              posts: [createPost, ...existingPosts.posts]
            }
          });
        }
      });
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error creating post:", error);
    }
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
