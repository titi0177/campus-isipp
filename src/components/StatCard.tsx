export default function StatCard({icon:Icon,title,value,color}){

return(

<div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">

<div className={`p-3 rounded-lg ${color}`}>
<Icon size={20}/>
</div>

<div>

<p className="text-sm text-gray-500">
{title}
</p>

<p className="text-2xl font-bold">
{value}
</p>

</div>

</div>

)

}