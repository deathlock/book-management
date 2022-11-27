import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

const Components = {
  ErDiagram: componentLoader.add('ErDiagram', './ErDiagram'),
  BucketExplorer: componentLoader.add('BucketExplorer', './BucketExplorer'),
};

export { componentLoader, Components };
