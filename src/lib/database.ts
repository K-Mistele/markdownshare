// Re-export data fetching functions from data.ts (these are NOT server actions)
export {
	getDocument,
	getDocumentWithAuthor,
	getUserDocuments,
	getPublicDocuments,
	getUser,
	getDocumentCollaborators,
	getDocumentComments,
	canUserAccessDocument,
	canUserEditDocument,
} from "./data";

// Re-export server actions from actions.ts (these ARE server actions)
export {
	createDocument,
	updateDocument,
	deleteDocument,
	createUser,
	updateUser,
	addCollaborator,
	updateCollaboratorPermission,
	removeCollaborator,
	createComment,
	updateComment,
	deleteComment,
} from "./actions";
