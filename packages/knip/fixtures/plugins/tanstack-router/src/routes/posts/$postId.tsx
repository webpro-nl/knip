import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
});

function PostComponent() {
  const { postId } = Route.useParams();
  return <div>Post {postId}</div>;
}
