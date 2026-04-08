export default function Table({columns,data}){

return(

<table className="w-full text-sm">

<thead>

<tr className="border-b text-gray-500">

{columns.map(c=>(
<th key={c} className="text-left py-3">
{c}
</th>
))}

</tr>

</thead>

<tbody>

{data.map((row,i)=>(
<tr key={i} className="border-b hover:bg-gray-50">
{row}
</tr>
))}

</tbody>

</table>

)

}