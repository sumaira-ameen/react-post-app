
import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { useState } from "react";

import { Button, Modal, Form, Card, Container } from 'react-bootstrap';

const Post = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const { data , isPending, isError, error} = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const response = fetch("https://dummyjson.com/posts")
          .then((res) => res.json())
          .then((res) => res.posts);
        console.log(response);

        return response;
      } catch (error) {
        console.log(error);
      }
    },
  });
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async ({ title, body }) => {
      const response = await fetch('https://dummyjson.com/posts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, userId: 1 }), // userId is required by the API
      });
      return response.json();
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(['posts'], (curEle) => [newPost, ...curEle]); // Add new post to the top of the list
      setShowCreateForm(false); // Close the create form
      setNewPost({ title: '', body: '' }); // Reset the form
    },
  });



  

  // Handle create button click
  const handleCreateClick = () => {
    setShowCreateForm(true); // Show the create form
  };

  // Handle create form submission
  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(newPost); // Trigger the create mutation
  };

  // Handle input changes in the create form
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await fetch(`https://dummyjson.com/posts/${postId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: (data, postId) => {
      console.log(data);
      queryClient.setQueryData(["posts"], (curEle) => {
        return curEle.filter((post) => post.id !== postId);
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({postId,title,body}) => {
      const response = await fetch(`https://dummyjson.com/posts/${postId}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({title,body})
      });
      return response.json();
    },
    onSuccess: (updatedPost) => {//updated post object returned by the API
      queryClient.setQueryData(["posts"], (curEle) => {
        return curEle.map((post) =>(post.id === updatedPost.id ? updatedPost : post));
      });
    },
  });
  // Handle update button click
  const handleUpdate = (postId, currentTitle, currentBody) => {
    const newTitle = prompt('Enter the new title:', currentTitle);
    const newBody = prompt('Enter the new body:', currentBody);

    if (newTitle !== null && newBody !== null) {
      updateMutation.mutate({ postId, title: newTitle, body: newBody });
    }
  };
  if(isPending) return <h1>Loading...</h1>
  if(isError) return <h1>Error: {error.message}</h1>

  return (
    <>
      {/* {data?.map(({title, id, body})=>(
      <div key={id}>
        <h1>{title}</h1>
        <p>{body}</p>

      </div>
     ))} */}
      {/* Create Post Button */}
      <Button variant="success" className="m-3" onClick={handleCreateClick}>
        Create Post
      </Button>
       {/* Create Post Form Modal */}

       <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateFormSubmit}>
            <Form.Group controlId="formTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newPost.title}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formBody">
              <Form.Label>Body</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="body"
                value={newPost.body}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              Create
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {data?.map(({ title, id, body }) => (
        <Container key={id}>
          <br />
          <Card key={id}>

            <Card.Header>{id} {title}</Card.Header>
            <Card.Body>
              <blockquote className="blockquote mb-0">
                <p>{body}</p>
                <footer className="blockquote-footer">
                  Someone famous in{" "}
                  <cite title="Source Title">Source Title</cite>
                  <button
                    className="btn btn-secondary mx-2"
                    onClick={() => handleUpdate(id, title, body)}
                  >
                    Update
                  </button>
                  <button
                    className="btn btn-primary mx-5"
                    onClick={() => deleteMutation.mutate(id)}
                  >
                    Delete
                  </button>
                </footer>
              </blockquote>
            </Card.Body>
          </Card>
          <br />
        </Container>
      ))}
    </>
  );
};

export default Post;
