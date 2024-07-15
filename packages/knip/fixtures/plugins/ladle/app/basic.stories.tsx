export const Hello = () => <h2>Simple Story</h2>;

export const Responsive = () => {
  return (
    <>
      <div
        style={{
          width: '100',
          background: '#000',
          color: '#FFF',
          padding: '32px 32px',
          border: '1px solid black',
          fontFamily: 'arial',
          fontSize: 28,
        }}
      >
        Header
      </div>
      <button
        style={{
          padding: '16px 102px',
          fontFamily: 'arial',
          fontSize: 22,
          margin: 32,
          borderRadius: 8,
          color: '#174291',
          border: '2px solid #174291',
          background: '#FFF',
        }}
      >
        Ladle v4
      </button>
    </>
  );
};
Responsive.meta = {
  width: 'xsmall',
};

