const { getUnacceptedPoints } = require('../model/audits');

exports.createAudit = async ({ weights, storeId, results, auditor, date }) => {
  const lastNotAcceptedPoints = await getUnacceptedPoints(storeId);

  const audit = new Audit(auditor, date, storeId);

  Object.entries(results).forEach(([id, { accepted, comment }]) => {
    audit.addCategoryPoint(
      new CategoryPoint({
        id,
        accepted,
        comment,
        lastNotAcceptedPoints,
        weight: weights[id],
      })
    );
  });
  return audit;
};

class Audit {
  constructor(auditor, date, storeId) {
    this.auditor = auditor;
    this.date = date;
    this.storeId = storeId;
    this.categories = [];
    this.totalScore = new Score();
  }

  addCategoryPoint(categoryPoint) {
    const category = this.getCategory(categoryPoint);
    category.addPoint(categoryPoint);
    this.totalScore.changeScore(categoryPoint);
  }

  getCategory(categoryPoint) {
    const categoryId = this.getCategoryId(categoryPoint);
    let category = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    if (!category) {
      category = new Category(categoryId);
      this.categories.push(category);
    }

    return category;
  }
  getCategoryId(categoryPoint) {
    return Number(categoryPoint.id.slice(1, 3));
  }
}

class Category {
  constructor(categoryId) {
    this.categoryId = categoryId;
    this.categoryPoints = [];
    this.score = new Score();
  }
  addPoint(categoryPoint) {
    const { id, accepted, comment, unacceptedInARow } = categoryPoint;
    this.categoryPoints.push({
      id,
      accepted,
      ...(comment ? { comment } : {}),
      ...(unacceptedInARow ? { unacceptedInARow } : {}),
    });
    this.score.changeScore(categoryPoint);
  }
}

class CategoryPoint {
  constructor({ id, accepted, comment, weight, lastNotAcceptedPoints }) {
    this.id = id;
    this.accepted = accepted;
    this.comment = comment;
    this.weight = weight;
    this.unacceptedInARow = this.numOfUnacceptances(lastNotAcceptedPoints);
  }

  numOfUnacceptances(lastNotAcceptedPoints) {
    if (this.accepted) {
      return undefined;
    }
    return lastNotAcceptedPoints[this.id] + 1 || 1;
  }
}

class Score {
  constructor() {
    this.available = 0;
    this.earned = 0;
    this.perc = 0;
  }

  changeScore({ weight, accepted }) {
    if (accepted) {
      this.earned += weight;
    }
    this.available += weight;
    this.perc = (100 * this.earned) / this.available;
  }
}
