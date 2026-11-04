import {supabaseServer} from '@/lib/supabase';
export async function SponsorSlot({placement='Homepage'}:{placement?:string}) {
  const db=await supabaseServer();
  if(!db) return <div className="ad-slot"><span>GLAMORA PARTNERS</span><strong>Tu marca, en el centro de la conversación.</strong><a href="/publicidad">CONSULTAR ESPACIOS PUBLICITARIOS ↗</a></div>;
  const {data}=await db.from('sponsors').select('name,logo_url,target_url').eq('placement',placement).eq('is_active',true).limit(3);
  if(!data?.length) return <div className="ad-slot"><span>GLAMORA PARTNERS</span><strong>Tu marca, en el centro de la conversación.</strong><a href="/publicidad">CONSULTAR ESPACIOS PUBLICITARIOS ↗</a></div>;
  return <div className="sponsor-row"><span className="sponsor-label">EN ALIANZA CON</span>{data.map((s,i)=><a key={`${s.name}-${i}`} href={s.target_url||'#'} target={s.target_url?'_blank':undefined} rel="noreferrer" className="sponsor-brand">{s.logo_url?<img src={s.logo_url} alt={s.name}/>:s.name}</a>)}</div>;
}
