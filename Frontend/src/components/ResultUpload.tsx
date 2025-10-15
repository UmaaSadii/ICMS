import React from 'react';
import { useResultUploadController } from '../controllers/ResultUploadController';
import ResultUploadView from '../views/ResultUploadView';

const ResultUpload = () => {
  const controllerProps = useResultUploadController();
  return <ResultUploadView {...controllerProps} />;
};

export default ResultUpload;
