import { useWorkspace } from './features/workspace/WorkspaceStore';
import Landing from './features/uploader/components/Landing';
import Workspace from './features/workspace/components/Workspace';

export default function App() {
  const { hasUploaded } = useWorkspace();
  return hasUploaded ? <Workspace /> : <Landing />;
}
