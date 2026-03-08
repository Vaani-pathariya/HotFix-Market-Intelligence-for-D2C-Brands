import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', sales: 4000, anomaly: false },
    { name: 'Tue', sales: 3000, anomaly: false },
    { name: 'Wed', sales: 2000, anomaly: true },
    { name: 'Thu', sales: 2780, anomaly: false },
    { name: 'Fri', sales: 1890, anomaly: true },
    { name: 'Sat', sales: 2390, anomaly: false },
    { name: 'Sun', sales: 3490, anomaly: false },
];

const SalesChart = () => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
