const { getNumOfRepetitions } = require('../model/audits');
const { ObjectId } = require('mongodb');
const { getWeights } = require('../model/points');

class Audit {
  constructor({
    _id = ObjectId(),
    auditor,
    date = new Date(),
    storeId,
    totalScore = { available: 0, earned: 0, perc: 0 },
    categories = [],
  }) {
    this._id = _id;
    this.auditor = auditor;
    this.date = date;
    this.storeId = storeId;
    this.totalScore = new Score(totalScore);
    this.categories = categories.map((category) => new Category(category));
  }

  async toggleResult(categoryPointId) {
    const category = this.getCategoryById(categoryPointId);
    const categoryPoint = category.getCategoryPoint(categoryPointId);
    const weights = await getWeights();

    categoryPoint.accepted = !categoryPoint.accepted;

    if (categoryPoint.accepted) {
      category.score.addPoints(weights[categoryPointId]);
      this.totalScore.addPoints(weights[categoryPointId]);
      delete categoryPoint.unacceptedInARow;
      return;
    }
    category.score.substractPoints(weights[categoryPointId]);
    this.totalScore.substractPoints(weights[categoryPointId]);
    const previousNumOfRepetitions = await getNumOfRepetitions({
      date: this.date,
      storeId: this.storeId,
      categoryPointId,
    });
    categoryPoint.unacceptedInARow = previousNumOfRepetitions + 1 || 1;
  }

  addCategoryPoint(categoryPoint) {
    const category = this.getCategoryById(categoryPoint.id);
    category.addPoint(categoryPoint);
    this.totalScore.addCategoryPoint(categoryPoint);
  }

  getCategoryById(categoryPointId) {
    const categoryId = this.getCategoryId(categoryPointId);
    let category = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    if (!category) {
      category = new Category({ categoryId });
      this.categories.push(category);
    }

    return category;
  }

  getCategoryId(categoryPointId) {
    return Number(categoryPointId.slice(1, 3));
  }
}

class Category {
  constructor({
    categoryId,
    categoryPoints = [],
    score = { available: 0, earned: 0, perc: 0 },
  }) {
    this.categoryId = categoryId;
    this.score = new Score(score);
    this.categoryPoints = categoryPoints;
  }

  addPoint(categoryPoint) {
    const { id, accepted, comment, unacceptedInARow } = categoryPoint;
    this.categoryPoints.push({
      id,
      accepted,
      ...(comment ? { comment } : {}),
      ...(unacceptedInARow ? { unacceptedInARow } : {}),
    });
    this.score.addCategoryPoint(categoryPoint);
  }

  getCategoryPoint(id) {
    return this.categoryPoints.find((categoryPoint) => categoryPoint.id === id);
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
  constructor({ available = 0, earned = 0, perc = 0 }) {
    this.available = available;
    this.earned = earned;
    this.perc = perc;
  }

  addCategoryPoint({ weight, accepted }) {
    if (accepted) {
      this.earned += weight;
    }
    this.available += weight;
    this.calcPerc();
  }

  calcPerc() {
    this.perc = (100 * this.earned) / this.available;
  }

  addPoints(weight) {
    this.earned += weight;
    this.calcPerc();
  }

  substractPoints(weight) {
    this.earned -= weight;
    this.calcPerc();
  }
}

exports.Audit = Audit;
exports.CategoryPoint = CategoryPoint;
