import GuidePage from './GuidePage';
import data from '../../data/firstAid';

export default function FirstAidPage() {
  return (
    <GuidePage
      items={data}
      basePath="/first-aid"
      title="First aid"
      intro="Step-by-step help for common emergencies. If the person is not breathing or you are unsure, call the ambulance first."
    />
  );
}
