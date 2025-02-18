import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Modal, Form, Card, Container } from 'react-bootstrap';
import Swal from 'sweetalert2';
import styles from './Post.module.css';

const Post = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const queryClient = useQueryClient();

  //  posts query
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const response = await fetch("https://dummyjson.com/posts");
        return response.json().then(res => res.posts);
      } catch (error) {
        throw new error('Failed to fetch posts');
      }
    },
  });

  // create mutation
  const createMutation = useMutation({
    mutationFn: async ({ title, body }) => {
      const response = await fetch('https://dummyjson.com/posts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, userId: 1 }),
      });
      return response.json();
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(['posts'], (curEle) => [newPost, ...curEle]);
      setShowCreateForm(false);
      setNewPost({ title: '', body: '' });
      Swal.fire('Success!', 'Post created successfully!', 'success');
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to create post', 'error');
    }
  });

  // update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ postId, title, body }) => {
      const response = await fetch(`https://dummyjson.com/posts/${postId}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
      });
      return response.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(["posts"], (curEle) => 
        curEle.map((post) => post.id === updatedPost.id ? updatedPost : post)
      );
      Swal.fire('Success!', 'Post updated successfully!', 'success');
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to update post', 'error');
    }
  });

  // delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await fetch(`https://dummyjson.com/posts/${postId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData(["posts"], (curEle) => 
        curEle.filter((post) => post.id !== postId)
      );
      Swal.fire('Success!', 'Post deleted successfully!', 'success');
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to delete post', 'error');
    }
  });

  // handle update with swal
  const handleUpdate = async (postId, currentTitle, currentBody) => {
    const { value: formValues } = await Swal.fire({
      title: 'Update Post',
      html:
        '<input id="title" class="swal2-input" placeholder="Title" value="' + currentTitle + '">' +
        '<textarea id="body" class="swal2-textarea" placeholder="Body">' + currentBody + '</textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        return {
          title: document.getElementById('title').value,
          body: document.getElementById('body').value
        }
      }
    });

    if (formValues) {
      updateMutation.mutate({ postId, ...formValues });
    }
  };

  // handle dlt confirmation
  const confirmDelete = (postId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(postId);
      }
    });
  };

  if (isPending) return <div className="text-center mt-4"><h2>Loading...</h2></div>;
  if (isError) return <div className="text-center mt-4"><h2>Error: {error.message}</h2></div>;

  return (
    <div className={styles.postContainer}>
      <Button 
        variant="success" 
        className={`m-3 ${styles.customButton}`}
        onClick={() => setShowCreateForm(true)}
      >
        Create Post
      </Button>

      {/* create postmodal */}
      <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)}>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Create New Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newPost);
          }}>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="body"
                value={newPost.body}
                onChange={(e) => setNewPost({...newPost, body: e.target.value})}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="primary" 
                type="submit"
                className={styles.customButton}
              >
                Create Post
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* post list */}
      {data?.map(({ id, title, body }) => (
        <Container key={id} className="mb-4">
          <Card className={styles.customCard}>
            <Card.Header className={styles.cardHeader}>#{id} {title}</Card.Header>
            <Card.Body>
              <Card.Text>{body}</Card.Text>
              <div className={styles.actionButtons}>
                <Button
                  variant="success"
                  className={styles.customButton}
                  onClick={() => handleUpdate(id, title, body)}
                >
                  Update
                </Button>
                <Button
                  variant="danger"
                  className={styles.customButton}
                  onClick={() => confirmDelete(id)}
                >
                  Delete
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      ))}
    </div>
  );
};

export default Post;