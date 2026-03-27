import { useState } from 'react'
import './App.css'

const toPercent = (value, max = 1) => {
  const safeMax = max > 0 ? max : 1
  const normalized = (Number(value) / safeMax) * 100
  return Math.max(0, Math.min(100, normalized))
}

function App() {
  const [opticalFile, setOpticalFile] = useState(null)
  const [sarFile, setSarFile] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleOpticalFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setOpticalFile(file)
    setPrediction(null)
    setError('')
  }

  const handleSarFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setSarFile(file)
    setPrediction(null)
    setError('')
  }

  const handleImageUpload = async (event) => {
    event.preventDefault()
    if (!opticalFile || !sarFile) return

    const formData = new FormData()
    formData.append('optical_file', opticalFile)
    formData.append('sar_file', sarFile)

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('AI Prediction:', data)
      setPrediction(data)
    } catch (uploadError) {
      console.error('Error connecting to backend:', uploadError)
      setError(
        uploadError?.message ||
          'Unable to connect to backend. Make sure FastAPI is running on port 8000.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const summary = prediction?.data_summary ?? {}
  const regression = prediction?.metrics?.regression_heights ?? {}
  const segmentation = prediction?.metrics?.segmentation_footprints ?? {}
  const buildings = Array.isArray(prediction?.buildings_data)
    ? prediction.buildings_data
    : []
  const visualizations = prediction?.visualizations ?? {}

  const maxDisplayedHeight = buildings.reduce(
    (max, b) => Math.max(max, Number(b.predicted_height_m) || 0, Number(b.actual_height_m) || 0),
    1,
  )

  const segmentationBars = [
    { label: 'IoU', value: segmentation.iou ?? 0 },
    { label: 'F1 Score', value: segmentation.f1_score ?? 0 },
    { label: 'Precision', value: segmentation.precision ?? 0 },
    { label: 'Recall', value: segmentation.recall ?? 0 },
  ]

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Satellite Image Inference</p>
        <h1>Upload Optical + SAR</h1>
        <p className="subtitle">
          Choose both images and send them to your FastAPI prediction endpoint.
        </p>

        <form className="upload-form" onSubmit={handleImageUpload}>
          <label className="file-input" htmlFor="opticalUpload">
            <span>
              Optical image: {opticalFile ? opticalFile.name : 'choose image file'}
            </span>
            <input
              id="opticalUpload"
              type="file"
              accept=".tif,.tiff,image/*"
              onChange={handleOpticalFileChange}
            />
          </label>

          <label className="file-input" htmlFor="sarUpload">
            <span>SAR image: {sarFile ? sarFile.name : 'choose image file'}</span>
            <input
              id="sarUpload"
              type="file"
              accept=".tif,.tiff,image/*"
              onChange={handleSarFileChange}
            />
          </label>

          <button type="submit" disabled={!opticalFile || !sarFile || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {error && <p className="message error">{error}</p>}

        {prediction && (
          <div className="result">
            <h2>Model Output</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Status</p>
                <p className="stat-value">{prediction.status || 'unknown'}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Buildings Detected</p>
                <p className="stat-value">{summary.buildings_detected ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">MAE (m)</p>
                <p className="stat-value">{regression.mae ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">RMSE (m)</p>
                <p className="stat-value">{regression.rmse ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">R2 Score</p>
                <p className="stat-value">{regression.r2_score ?? 0}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Max Height Detected (m)</p>
                <p className="stat-value">{summary.max_height_detected_m ?? 0}</p>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Segmentation Metrics</h3>
                <div className="metric-bars">
                  {segmentationBars.map((item) => (
                    <div className="metric-row" key={item.label}>
                      <div className="metric-head">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="metric-track">
                        <div
                          className="metric-fill"
                          style={{ width: `${toPercent(item.value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Top Building Height Comparison</h3>
                <div className="height-bars">
                  {buildings.slice(0, 6).map((building) => (
                    <div className="height-row" key={building.rank}>
                      <div className="height-title">Building {building.rank}</div>
                      <div className="height-track-group">
                        <div className="height-track">
                          <div
                            className="height-fill predicted"
                            style={{
                              width: `${toPercent(
                                building.predicted_height_m,
                                maxDisplayedHeight,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="height-value">
                          Pred: {building.predicted_height_m}m
                        </span>
                      </div>
                      <div className="height-track-group">
                        <div className="height-track">
                          <div
                            className="height-fill actual"
                            style={{
                              width: `${toPercent(
                                building.actual_height_m,
                                maxDisplayedHeight,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="height-value">Actual: {building.actual_height_m}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {buildings.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Predicted Height (m)</th>
                      <th>Actual Height (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((building) => (
                      <tr key={building.rank}>
                        <td>{building.rank}</td>
                        <td>{building.predicted_height_m}</td>
                        <td>{building.actual_height_m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="images-grid">
              {visualizations.image_contours_b64 && (
                <figure className="result-image-card">
                  <img
                    src={visualizations.image_contours_b64}
                    alt="Predicted building contours"
                  />
                  <figcaption>Optical Image + Predicted Contours</figcaption>
                </figure>
              )}

              {visualizations.image_heatmap_b64 && (
                <figure className="result-image-card">
                  <img
                    src={visualizations.image_heatmap_b64}
                    alt="Predicted height heatmap"
                  />
                  <figcaption>Predicted Height Heatmap</figcaption>
                </figure>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
