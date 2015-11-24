import Gentle from 'gentle';
import DesignerView from './views/designer_view';
import HomeDesignerView from './views/home_designer_view';
import SequencesCollection from '../../sequence/models/sequences';
import WipCircuit from './lib/wip_circuit';
import Circuit from './lib/circuit';


Gentle.addPlugin('sequence-primary-view', {
  name: 'designer',
  title: 'Assemble sequences',
  view: DesignerView,
  maximize: true,
  visible: () => false
});

Gentle.addPlugin('home', {
  name: 'designer',
  title: 'New RDP circuit',
  view: HomeDesignerView,
  order: -1,
  active: true,
});

SequencesCollection.registerConstructor(WipCircuit, 'wip_circuit');
SequencesCollection.registerConstructor(Circuit, 'circuit');
