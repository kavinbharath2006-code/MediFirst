import GuidePage from './GuidePage';
import data from '../../data/machines';

export default function MachinesPage() {
  return (
    <GuidePage
      items={data}
      basePath="/machines"
      title="Devices"
      intro="How to use common first aid and home health devices correctly."
      watchHeading="Safety and when to get help"
    />
  );
}
