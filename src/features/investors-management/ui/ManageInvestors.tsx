import { getInvestors, deleteInvestor, addInvestor } from '@/entities/investor';

export async function ManageInvestors() {
  const investors = await getInvestors();

  return (
    <div className="investors-page">
      <h1>Investor Management</h1>

      <section className="card">
        <h2>Add New Investor</h2>
        <form
          action={async (formData: FormData) => {
            'use server';
            const name = formData.get('name') as string;
            const capital = parseFloat(formData.get('capital') as string);
            const deposit = parseFloat(formData.get('deposit') as string);
            await addInvestor(name, capital, deposit);
          }}
        >
          <div className="form-group">
            <label>Name</label>
            <input name="name" type="text" required />
          </div>
          <div className="form-group">
            <label>Initial Capital ($)</label>
            <input name="capital" type="number" step="0.01" required />
          </div>
          <div className="form-group">
            <label>Initial Deposit ($)</label>
            <input name="deposit" type="number" step="0.01" required />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Investor
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Existing Investors</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Current Capital</th>
              <th>Current Deposit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((investor) => (
              <tr key={investor.id}>
                <td>{investor.name}</td>
                <td>${investor.current_capital.toLocaleString()}</td>
                <td>${investor.current_deposit.toLocaleString()}</td>
                <td>
                  <form
                    action={async () => {
                      'use server';
                      await deleteInvestor(investor.id);
                    }}
                  >
                    <button type="submit" className="btn btn-danger">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
