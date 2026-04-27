import RewardScreen from '../../components/customer/RewardScreen'

export default function RewardPreview() {
  return (
    <RewardScreen
      rewardQrToken="PREVIEW-TOKEN-1234-ABCD-5678"
      merchantName="Boulangerie Dupont"
      rewardDescription="1 café offert"
      expiresAt={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
      onClose={() => {}}
    />
  )
}
