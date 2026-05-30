# Cleaning & Normalisation Summary

## 1. Skill Normalisation

### Processing Steps

* Split comma-separated skills into individual items.
* Converted all skills to lowercase.
* Applied alias expansion:

  * `fea` → `finite element analysis`
  * `gd&t` → `geometric dimensioning and tolerancing`
  * `api` → `api development`
* Removed special characters while retaining:

  * Letters (`a-z`)
  * Numbers (`0-9`)
  * Spaces
  * `/`, `+`, `#`, `.`
* Deduplicated skills within each row while preserving original order.

### Additional Columns Created

| Column              | Description                     |                            |
| ------------------- | ------------------------------- | -------------------------- |
| `Skills_Normalised` | Pipe-separated (`               | `) normalized skill string |
| `Skills_List`       | JSON array of normalized skills |                            |

---

## 2. Salary Cleaning

### Processing Steps

* Converted the following columns to numeric values:

  * `Salary_Min`
  * `Salary_Max`
  * `Salary_Avg`
* Coerced non-numeric values to `0`.
* Filled null values with `0`.
* Cast all salary columns to integer type.

### Additional Column Created

| Column            | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `Has_Salary_Data` | Boolean flag indicating whether valid salary information exists |

### Summary

* Rows with salary data: **129**
* Rows without salary data: **286**

Most rows without salary data correspond to internship or school-level opportunities.

---

## 3. Experience Label Mapping

Mapped numerical `Experience_Level` values to human-readable labels.

| Experience_Level | Label                   | Rows |
| ---------------- | ----------------------- | ---- |
| 0.0              | Beginner / Intern       | 7    |
| 1.0              | Entry-level (0–2 years) | 284  |
| 2.0              | Mid-level (2–5 years)   | 70   |
| 3.0              | Senior-level (5+ years) | 54   |

### Note

A fix was added to correctly handle the previously unmapped value:

```text
0.0 → Beginner / Intern
```

---

## 4. Missing Values

### Intentionally Preserved Null Columns

The following fields contained genuine missing values and were left unchanged:

* `Companies`
* `Projects`
* `Salary_Range`

### Null Count

* Total affected rows: **286**

### Reason

These records primarily represent internship or school-level roles where the information was unavailable.

### Additional Handling

* Salary availability is captured using `Has_Salary_Data`.
* The embedding generation pipeline safely skips null `Projects` values.

### Result

No other columns contained missing values after preprocessing.

---

## 5. Column Rename Compatibility Fix

### Issue

The source CSV used:

```text
Job_Role
```

while the processing script expected:

```text
Job Role
```

### Solution

Added automatic column detection and mapping to support both naming conventions without causing pipeline failures.

---

## 6. Embedding Text Construction

Created a new column:

```text
Embedding_Text
```

### Purpose

This field serves as the input text for SBERT embedding generation.

### Components Included

* Job Role
* Normalized Skills
* Projects (when available)
* Experience Information

### Example Structure

```text
Software Engineer |
Python | Machine Learning | SQL |
Built recommendation system using collaborative filtering |
Entry-level (0-2 years)
```

The resulting text is used to generate vector embeddings for semantic search, recommendation, and similarity matching tasks.

---

## Final Output Columns Added

| Column              | Purpose                          |
| ------------------- | -------------------------------- |
| `Skills_Normalised` | Pipe-separated normalized skills |
| `Skills_List`       | JSON array of skills             |
| `Has_Salary_Data`   | Salary availability indicator    |
| `Embedding_Text`    | SBERT embedding input text       |

---

## Dataset Status After Cleaning

✅ Skills normalized and deduplicated

✅ Salary fields standardized

✅ Experience levels mapped to readable labels

✅ Missing values handled appropriately

✅ Column naming inconsistencies resolved

✅ Embedding text prepared for SBERT vector generation

The dataset is now ready for feature engineering, embedding generation, semantic search, recommendation systems, and downstream machine learning workflows.
