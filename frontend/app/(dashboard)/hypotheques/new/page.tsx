import HypothequeForm from '@/components/hypotheques/HypothequeForm';

export default function NewHypothequePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Nouvelle Hypothèque</h2>
        <p className="text-slate-500 text-sm mt-1">
          Renseignez les informations en 3 étapes
        </p>
      </div>
      <HypothequeForm />
    </div>
  );
}
